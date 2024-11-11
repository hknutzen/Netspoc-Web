#!/usr/local/bin/perl

=head1 NAME

netspoc.psgi - A web frontend for Netspoc

=head1 COPYRIGHT AND DISCLAIMER

(C) 2023 by Heinz Knutzen     <heinz.knutzen@gmail.com>
            Daniel Brunkhorst <daniel.brunkhorst@web.de>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

=cut

use strict;
use warnings;
use JSON;
use Plack::Util;
use Plack::Request;
use Plack::Response;
use Plack::Builder;
use Plack::Middleware::XForwardedFor;
use CGI::Session;
use CGI::Session::Driver::file;
use Digest::MD5      qw/md5_hex/;
use Digest::SHA      qw/sha256_hex/;
use String::MkPasswd qw(mkpasswd);
use Crypt::SaltedHash;
use Net::LDAP;
use Encode;

use FindBin;
use lib $FindBin::Bin;
use Load_Config;
use User_Store;
use Template;
use Text::Template 'fill_in_file';
use JSON_Cache;
use Policy_Diff;

# VERSION: inserted by DZP::OurPkgVersion
my $version = __PACKAGE__->VERSION || 'devel';

sub abort {
    my ($msg) = @_;
    die "$msg\n";
}

sub internal_err {
    my ($msg) = @_;
    abort "internal: $msg";
}

## no critic (RequireArgUnpacking)
sub unique {
    my %seen;
    return grep { !$seen{$_}++ } @_;
}
## use critic

sub intersect {
    my @non_compl = @_;
    my $result;
    for my $element ( @{ pop @non_compl } ) {
        $result->{$element} = $element;
    }
    for my $set (@non_compl) {
        my $intersection;
        for my $element (@$set) {
            if ( $result->{$element} ) {
                $intersection->{$element} = $element;
            }
        }
        $result = $intersection;
    }
    return [ keys %$result ];
}

# Delete an element from an array reference.
# Return 1 if found, 0 otherwise.
sub aref_delete {
    my ( $aref, $elt ) = @_;
    for ( my $i = 0 ; $i < @$aref ; $i++ ) {
        if ( $aref->[$i] eq $elt ) {
            splice @$aref, $i, 1;
            return 1;
        }
    }
    return 0;
}

my $config;

# Read modification date of and policy number from file POLICY.
# Content is: # pnnnnn #...
sub get_policy_from_file {
    my ($policy_path) = @_;
    $policy_path .= "/POLICY";
    my $mtime = ( stat($policy_path) )[9];
    my ( $sec, $min, $hour, $mday, $mon, $year ) = localtime($mtime);
    $mon  += 1;
    $year += 1900;
    my $date = sprintf( "%d-%.2d-%.2d", $year, $mon, $mday );
    my $time = sprintf( "%.2d:%.2d",    $hour, $min );
    open( my $fh, '<', $policy_path ) or abort "Can't open $policy_path: $!";
    my $policy = <$fh>;
    close($fh);
    $policy =~ m/^# (\S+)/ or abort "Can't find policy name in $policy_path";
    $policy = $1;
    return {
        policy => $policy,
        date   => $date,
        time   => $time,
    };
}

sub get_policy {
    my $policy_path = "$config->{netspoc_data}/current";
    my $entry       = get_policy_from_file($policy_path);
    $entry->{current} = 1;
    return [$entry];
}

sub get_history {
    my ( $req, $session ) = @_;
    my $owner          = $req->param('active_owner');
    my $current        = get_policy()->[0];
    my $current_policy = $current->{policy};
    my @result         = ($current);

    {
        # Add data from directory "history",
        # containing a subdirecory for each revision:
        # 2020-04-08/
        #    POLICY
        #    owner/$owner/
        # 2020-04-09/
        #    POLICY
        #    ...
        # We take date, time from POLICY file.
        my $hist_path = "$config->{netspoc_data}/history";
        -d $hist_path or last;
        my @changed = qx(cd $hist_path; ls -rd */owner/$owner/CHANGED);
        for my $path (@changed) {
            my ($dir) = $path =~ /^(\d\d\d\d-\d\d-\d\d)/ or next;
            my $entry = get_policy_from_file("$hist_path/$dir");

            # If there wasn't added a new policy today, current policy
            # is available duplicate in history.
            next if $entry->{policy} eq $current_policy;
            push( @result, $entry );
        }
    }
    return \@result;
}

sub current_policy {
    return get_policy()->[0]->{policy};
}

my $selected_history;

sub select_history {
    my ( $req, $history_needed ) = @_;

    # Read requested version date from cgi parameter.
    if ( $selected_history = $req->param('history') ) {
        $history_needed or abort "Must not send parameter 'history'";
    }

    # Read current version tag from current/POLICY.
    else {
        $selected_history = current_policy();
    }
    return;
}

my $cache;

sub load_json {
    my ($key) = @_;
    return $cache->load_json_version( $selected_history, $key );
}

sub store_cache {
    my ( $key, $data, $context ) = @_;
    return $cache->store_cache_version( $selected_history, $key, $data,
        $context );
}

sub load_cache {
    my ( $key, $context ) = @_;
    return $cache->load_cache_version( $selected_history, $key, $context );
}

sub get_nat_set {
    my ($owner) = @_;
    return load_json("owner/$owner/nat_set");
}

sub get_service {
    my ( $services, $name ) = @_;
    my $svc = $services->{$name}
      or die "Can't access 'service:$name'";
    return $svc;
}

sub get_object {
    my ( $objects, $name ) = @_;
    my $obj = $objects->{$name}
      or die "Can't access '$name'";
    return $obj;
}

sub name2ip {
    my ( $obj_name, $nat_set ) = @_;
    my $objects = load_json('objects');
    my $obj     = get_object( $objects, $obj_name );
    if ( my $href = $obj->{nat} ) {
        for my $tag ( keys %$href ) {
            if ( $nat_set->{$tag} ) {
                return $href->{$tag};
            }
        }
    }
    return $obj->{ip};
}

sub get_nat_obj {
    my ( $obj_name, $nat_set ) = @_;
    my $objects = load_json('objects');
    my $obj     = get_object( $objects, $obj_name );
    if ( my $href = $obj->{nat} ) {
        for my $tag ( keys %$href ) {
            if ( $nat_set->{$tag} ) {
                my $nat_ip = $href->{$tag};
                return { %$obj, ip => $nat_ip };
            }
        }
    }
    return $obj;
}

sub get_nat_obj_list {
    my ( $obj_names, $owner ) = @_;
    my $nat_set = get_nat_set($owner);
    return [ map { get_nat_obj( $_, $nat_set ) } @$obj_names ];
}

# Intersect chosen networks with all networks
# within area of ownership.
# Return untainted networks as array-ref.
sub untaint_networks {
    my ( $chosen, $assets ) = @_;
    my $chosen_networks = [ split /,/, $chosen ];
    my $network_names   = $assets->{network_list};
    return intersect( $chosen_networks, $network_names );
}

sub get_networks {
    my ( $req, $session ) = @_;
    my $owner         = $req->param('active_owner');
    my $chosen        = $req->param('chosen_networks');
    my $assets        = load_json("owner/$owner/assets");
    my $network_names = $assets->{network_list};
    if ($chosen) {
        $network_names = untaint_networks( $chosen, $assets );
    }
    return get_nat_obj_list( $network_names, $owner );
}

sub get_network_resources_for_networks {
    my ( $req, $session, $selected ) = @_;
    my $owner  = $req->param('active_owner');
    my $assets = load_json("owner/$owner/assets");
    my $data   = [];

    if ($selected) {

        # Untaint: Intersect chosen networks with all networks
        # within area of ownership.
        my $network_names = untaint_networks( $selected, $assets );

        my $nat_set = get_nat_set($owner);
        my $objects = load_json('objects');
      SERVICE:
        for my $net_name ( @{$network_names} ) {
            my $child_names = $assets->{net2childs}->{$net_name};
            for my $name (@$child_names) {
                push @$data,
                  {
                    name        => $net_name,
                    child_ip    => name2ip( $name, $nat_set ),
                    child_name  => $name,
                    child_owner => {
                        owner => get_object( $objects, $name )->{owner},
                    }
                  };
            }
        }
    }
    return $data;
}

sub get_network_resources {
    my ( $req, $session ) = @_;
    my $selected = $req->param('selected_networks');
    return get_network_resources_for_networks( $req, $session, $selected );
}

sub get_networks_and_resources {
    my ( $req, $session ) = @_;
    my $owner       = $req->param('active_owner');
    my $networks    = get_networks( $req, $session );
    my $nets_as_csv = join( ',', map { $_->{name} } @$networks );
    my $net2data;
    map { $net2data->{ $_->{name} } = { ip => $_->{ip}, owner => $_->{owner} } }
      @$networks;
    my @data = sort { $a->{name} cmp $b->{name} }
      @{ get_network_resources_for_networks( $req, $session, $nets_as_csv ) };
    for my $net (@data) {
        my $child = {
            ip    => $net->{child_ip},
            name  => $net->{child_name},
            owner => $net->{child_owner}->{owner},
        };
        push @{ $net2data->{ $net->{name} }->{children} }, $child;
    }
    my @result = map {
        {
            name     => $_,
            ip       => $net2data->{$_}->{ip},
            owner    => $net2data->{$_}->{owner},
            children => $net2data->{$_}->{children},
        }
    } sort keys %$net2data;
    return \@result;
}

####################################################################
# Services, rules, users
####################################################################

sub has_user {
    my ( $rule, $what ) = @_;
    return $rule->{has_user} eq $what || $rule->{has_user} eq 'both';
}

# Substitute objects in rules by ip or name.
# Substitute 'users' keyword by ip or name of users.
sub adapt_name_ip_user {
    my ( $req, $rules, $user_names ) = @_;
    my $expand_users = $req->param('expand_users');
    my $disp_prop    = $req->param('display_property') || 'ip';
    my $owner        = $req->param('active_owner');
    my $nat_set      = get_nat_set($owner);

    # Untaint user input.
    $disp_prop =~ /^(?:name|ip|ip_and_name)$/
      or abort "Unknown display property '$disp_prop'";

    # Rules reference objects by name.
    # Build copy with
    # - names substituted by either $ip or { name => $name, ip => $ip }
    # - IP addresses in object with NAT applied.
    my @result;
    for my $rule (@$rules) {
        my ( $src, $dst ) = @{$rule}{qw(src dst)};
        if ($expand_users) {
            has_user( $rule, 'src' ) and $src = $user_names;
            has_user( $rule, 'dst' ) and $dst = $user_names;
        }
        my $get_val = sub {
            my ($names) = @_;
            if ( $disp_prop eq 'ip' ) {

                # Remove duplicate IP addresses.
                return [ unique map { name2ip( $_, $nat_set ) } @$names ];
            }
            elsif ( $disp_prop eq 'ip_and_name' ) {
                return [ map { { name => $_, ip => name2ip( $_, $nat_set ) } }
                      @$names ];
            }
            else {
                return $names;
            }
        };
        my $copy = {
            action => $rule->{action},
            src    => $get_val->($src),
            dst    => $get_val->($dst),
            prt    => $rule->{prt},
        };
        $copy->{has_user} = $rule->{has_user};

        push @result, $copy;

    }
    return \@result;
}

sub check_chosen_networks {
    my ($req)         = @_;
    my $chosen        = $req->param('chosen_networks') or return;
    my $owner         = $req->param('active_owner');
    my $assets        = load_json("owner/$owner/assets");
    my $network_names = untaint_networks( $chosen, $assets );
    my %relevant_objects =
      map( { $_ => 1 } (
            @$network_names,
            map( { @{ $assets->{net2childs}->{$_} } } @$network_names )
      ) );
    return \%relevant_objects;
}

my %rule_lookup = (
    'src'  => 'dst',
    'dst'  => 'src',
    'both' => 'both'
);

sub gen_search_regex {
    my ( $req, $search ) = @_;

    # Strip leading and trailing whitespaces.
    $search =~ s/^\s+//;
    $search =~ s/\s+$//;

    if ( !$req->param('search_case_sensitive') ) {
        $search = qr/\Q$search\E/i;
    }
    else {
        $search = qr/\Q$search\E/;
    }

    # Exact matches only?
    if ( $req->param('search_exact') ) {
        $search = qr/^$search$/;
    }
    return $search;
}

sub search_string {
    my ( $req, $service_list ) = @_;
    my $search   = $req->param('search_string') or return $service_list;
    my $owner    = $req->param('active_owner');
    my $services = load_json('services');
    my $result   = [];
    my $regex    = gen_search_regex( $req, $search );
    for my $sname (@$service_list) {

        # Check if service name itself contains $search.
        if ( $sname =~ $regex ) {
            push @$result, $sname;
            next;
        }
        if ( $req->param('search_in_desc') ) {
            if ( my $desc =
                get_service( $services, $sname )->{details}->{description} )
            {
                if ( $desc =~ $regex ) {
                    push @$result, $sname;
                    next;
                }
            }
        }
    }
    return $result;
}

# Convert from IP address in dotted notation into integer.
sub ip2int {
    my ($string) = @_;
    $string =~ m/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
      or abort("Expected IP address: '$string'");
    if ( $1 > 255 or $2 > 255 or $3 > 255 or $4 > 255 ) {
        abort("Invalid IP address: '$string'");
    }
    return $1 << 24 | $2 << 16 | $3 << 8 | $4;
}

# Convert from integer to IP address in dotted notation.
sub int2ip {
    my ($int) = @_;
    return sprintf "%vd", pack 'N', $int;
}

# Check if $ip1 is located inside network $ip/$mask.
sub match_ip {
    my ( $ip1, $ip, $mask ) = @_;
    return ( $ip == ( $ip1 & $mask ) );
}

# Conversion from netmask to prefix and vice versa.
{

    # Initialize private variables of this block.
    my %mask2prefix;
    my %prefix2mask;
    for my $prefix ( 0 .. 32 ) {
        my $mask = 2**32 - 2**( 32 - $prefix );
        $mask2prefix{$mask}   = $prefix;
        $prefix2mask{$prefix} = $mask;
    }

    # Convert a network mask to a prefix ranging from 0 to 32.
    sub mask2prefix {
        my $mask = shift;
        return $mask2prefix{$mask};
    }

    sub prefix2mask {
        my $prefix = shift;
        return $prefix2mask{$prefix};
    }
}

# Build hash which maps from object name to
# - { ip => i, mask => m }
# - or { ip1 => i1, $ip2 => i2, mask => m } for ranges.
sub build_ip_hash {
    my ($owner) = @_;
    my $cache_key = "ip_hash/$owner";
    if ( my $result = load_cache($cache_key) ) {
        return $result;
    }
    my $nat_set = get_nat_set($owner);

    my %ip_hash;
    my $objects = load_json('objects');
    for my $name ( keys %$objects ) {
        my $obj = get_object( $objects, $name );
        my $obj_ip;

        # Get NAT IP
        if ( my $href = $obj->{nat} ) {
            for my $tag ( keys %$href ) {
                if ( $nat_set->{$tag} ) {
                    $obj_ip = $href->{$tag};
                    last;
                }
            }
            $obj_ip ||= $obj->{ip};
        }
        else {
            $obj_ip = $obj->{ip};
        }

        # Ignore object without IP address.
        # Also currently ignore IPv6 address.
        $obj_ip =~ /\d[.]/ or next;

        # Missing mask (at most hosts and interfaces).
        if ( $obj_ip !~ m'/' ) {

            # Handle range.
            if ( $obj_ip =~ /-/ ) {
                my ( $ip1, $ip2 ) = split /-/, $obj_ip;
                my $i1 = ip2int($ip1);
                my $i2 = ip2int($ip2);
                $ip_hash{$name} = {
                    ip1  => $i1,
                    ip2  => $i2,
                    mask => 0xffffffff
                };
            }

            # Single IP address.
            else {
                my $i1 = ip2int($obj_ip);
                $ip_hash{$name} = { ip1 => $i1, mask => 0xffffffff };
            }
        }

        # Network or (matching) aggregate.
        else {
            my ( $ip, $len ) = split '/', $obj_ip;
            my $i1 = ip2int($ip);
            my $m1 = prefix2mask($len);
            $ip_hash{$name} = { ip1 => $i1, mask => $m1 };
        }
    }
    return store_cache( $cache_key, \%ip_hash );
}

# Chreate hash having those object names as key which match
# search request in $search, $sub, $super.
sub build_ip_search_hash {
    my ( $ip, $mask, $sub, $super, $owner ) = @_;

    my $len;
    if ( not defined $mask ) {
        $len = 32;
    }
    elsif ( $mask =~ /\D/ ) {
        defined( $len = mask2prefix( ip2int($mask) ) )
          or abort "Invalid netmask '$mask'";
    }
    elsif ( $mask > 32 ) {
        abort "Prefix len '$mask' too large";
    }
    else {
        $len = $mask;
    }

    # Check for valid ip.
    my $i = ip2int($ip);
    my $m = prefix2mask($len);

    # Mask 0 matches all.
    return if !$m && $sub;

    # Adapt ip to mask.
    $i = $i & $m;

    # Collect names of matching objects into %hash.
    my $objects = load_json('objects');
    my %hash;

    # Collect matching supernets to be inserted into %hash.
    my @supernets;

    # Collect names of zones where at least one non supernet / non
    # aggregate matches.
    my %matching_zones;
    my $add_matching_zone = sub {
        my ($name) = @_;
        my $obj = get_object( $objects, $name );

        # Ignore hosts, interfaces, but not loopback interfaces.
        if ( my $zone = $obj->{zone} ) {
            $matching_zones{$zone} = 1;
        }
    };

    my $ip_hash = build_ip_hash($owner);
    for my $name ( keys %$ip_hash ) {
        my ( $i1, $i2, $m1 ) = @{ $ip_hash->{$name} }{qw(ip1 ip2 mask)};

        # Range
        if ($i2) {
            if ( $sub && ( match_ip( $i1, $i, $m ) || match_ip( $i2, $i, $m ) )
                || ( $i1 <= $i && $i <= $i2 ) )
            {
                $hash{$name} = 1;
            }
            next;
        }

        if ( $m1 == $m ) {
            $i1 == $i or next;

            # Interface with negotiated IP has IP/mask of its network.
            # Find only, if subnets are searched.
            next if $name =~ /^interface:/ and not $sub and $m1 != 0xffffffff;

            # Add exact matching object.
            $add_matching_zone->($name) if $super;
        }
        elsif ( $m1 < $m ) {
            $super or next;
            next if $name =~ /^interface:/;
            match_ip( $i, $i1, $m1 ) or next;
            my $obj = get_object( $objects, $name );
            if ( $obj->{is_supernet} ) {
                push @supernets, $name;
                next;
            }
            $add_matching_zone->($name) if $name !~ /^any:/;

        }
        else {
            $sub                    or next;
            match_ip( $i1, $i, $m ) or next;
        }
        $hash{$name} = 1;
    }

    if ($super) {
        if ( !keys %matching_zones ) {
            for my $name (@supernets) {
                if ( $name =~ /^network:/ ) {
                    $hash{$name} = 1;
                }
            }
        }
        else {
            for my $name (@supernets) {
                my $obj  = get_object( $objects, $name );
                my $zone = $obj->{zone};
                if ( $matching_zones{$zone} ) {
                    $hash{$name} = 1;
                }
            }
        }
    }
    return \%hash;
}

sub build_text_search_hash {
    my ( $req, $search ) = @_;
    my $regex   = gen_search_regex( $req, $search );
    my $objects = load_json('objects');
    return { map { $_ => 1 } grep { $_ =~ $regex } keys %$objects };
}

# Chreate hash having those object names as key which match
# search request in $search, $sub, $super.
sub build_search_hash {
    my ( $req, $key ) = @_;

    # Undefined value or empty string or "0" is handled as "match all".
    my $search = $req->param($key) or return;
    my $owner  = $req->param('active_owner');
    my $sub    = $req->param('search_subnet')         || 0;
    my $super  = $req->param('search_supernet')       || 0;
    my $case   = $req->param('search_case_sensitive') || 0;
    my $exact  = $req->param('search_exact')          || 0;

    my $cache_key_hash = "$key/$owner/hash";
    my $search_prop    = "$sub/$super/$search/$case/$exact";
    if ( my $result = load_cache( $cache_key_hash, $search_prop ) ) {
        return $result;
    }

    my $result;
    if (
        my ( $ip, $mask ) = (
            $search =~ m'(\d+\.\d+\.\d+\.\d+)(?:[ /](\d+(?:\.\d+\.\d+\.\d+)?))?'
        )
      )
    {
        $result = build_ip_search_hash( $ip, $mask, $sub, $super, $owner );
    }
    else {
        $result = build_text_search_hash( $req, $search );
    }
    return store_cache( $cache_key_hash, $result, $search_prop );
}

sub build_proto_checker {
    my ($req) = @_;
    my $search_proto = $req->param('search_proto') or return;
    $search_proto = lc $search_proto;
    my $regex;

    # Search for
    if ( my ( $tcpudp, $port ) = $search_proto =~ /^((?:tcp|udp) )?(\d+)$/a ) {
        if ( $req->param('search_range') ) {
            $tcpudp ||= '(?:tcp|udp) ';

            # tcp|udp [source-port:]port|port-range
            $regex = qr/^$tcpudp(?:.*:)?(?:$port|(.*)-(.*))(?:$|,)/;
            return sub {
                my ($prt_list) = @_;
                return grep {
                    $_ =~ $regex
                      && ( !defined $1 || $1 <= $port && $port <= $2 )
                } @$prt_list;
            };
        }
        elsif ( defined $tcpudp ) {
            $regex = qr/^$tcpudp(?:.*:)?$port(?:$|,)/;
        }
        else {

            # Search whole number: protcol, source-port, type or code.
            $regex = qr/(?:^|[- :\/])$port($|[-:\/,])/;
        }
    }

    # Search for protocol name, protocol modifier or other substring.
    else {
        $regex = qr/ \Q$search_proto\E /x;
    }
    return sub {
        my ($prt_list) = @_;
        return grep { $_ =~ $regex } @$prt_list;
    };
}

# Search for search_ip1, search_ip2 in rules and users.
# If both are given,
# 1. search for ip1 in rules and ip2 in users
# 2. search for ip2 in rules and ip1 in users
# ip1 and ip2 can have an ip or string value.
# ip is
# - single ip adress
# - ip address followed by mask or prefix len
#   delimiter is slash or single blank.
# - string value to search in object names.
#
# Algorithm:
# 1. Build ip1_hash with names of objects matching ip1
# 2. Build ip2_hash with names of objects matching ip2
# 3. Search rules and users by simply comparing object names.
#
sub gen_search_req {
    my ($req)         = @_;
    my $ip1_hash      = build_search_hash( $req, 'search_ip1' );
    my $ip2_hash      = build_search_hash( $req, 'search_ip2' );
    my $proto_checker = build_proto_checker($req);
    $ip1_hash or $ip2_hash or $proto_checker or return;
    return ( $ip1_hash, $ip2_hash, $proto_checker );
}

sub gen_search_chosen {
    my ($req) = @_;
    my $chosen_objects = check_chosen_networks($req) or return;
    return ( $chosen_objects, undef, undef );
}

sub select_users {
    my ( $users, $obj_hash ) = @_;
    return $users if !$obj_hash;
    return [ grep { $obj_hash->{$_} } @$users ];
}

sub select_rules {
    my ( $rules, $matching_users, $obj_hash, $proto_checker ) = @_;
    return $rules if !$obj_hash && !$proto_checker;
    my @result;
  RULE:
    for my $rule (@$rules) {
        if ($proto_checker) {
            $proto_checker->( $rule->{prt} ) or next;
        }
        if ( !$obj_hash ) {
            push @result, $rule;
            next RULE;
        }
        my $has_user = $rule->{has_user};
        if ( $has_user eq 'both' ) {

            push @result, $rule if $matching_users;
            next RULE;
        }

        # Search in src or dst.
        for my $item ( @{ $rule->{ $rule_lookup{$has_user} } } ) {
            if ( $obj_hash->{$item} ) {
                push @result, $rule;
                next RULE;
            }
        }
    }
    return \@result;
}

sub select_services {
    my ( $req, $service_list, $obj1_hash, $obj2_hash, $proto_checker ) = @_;

    my $owner       = $req->param('active_owner');
    my $sname2users = load_json("owner/$owner/users");
    my $services    = load_json('services');
    my $result      = [];
  SERVICE:
    for my $sname (@$service_list) {

        my $users = $sname2users->{$sname} || [];
        my $rules = get_service( $services, $sname )->{rules};

        my $match_users = sub {
            my ($obj_hash) = @_;
            return 1 if !$obj_hash;
            for my $user (@$users) {
                if ( $obj_hash->{$user} ) {
                    return 1;
                }
            }
            return;
        };
        my $match_rules = sub {
            my ($obj_hash) = @_;
            return 1 if !$obj_hash && !$proto_checker;
            for my $rule (@$rules) {
                if ($proto_checker) {
                    $proto_checker->( $rule->{prt} ) or next;
                }
                return 1 if !$obj_hash;
                my $has_user = $rule->{has_user};
                if ( $has_user eq 'both' ) {
                    if ( $match_users->($obj_hash) ) {
                        return 1;
                    }
                }

                # Search in src or dst.
                for my $item ( @{ $rule->{ $rule_lookup{$has_user} } } ) {
                    if ( $obj_hash->{$item} ) {
                        return 1;
                    }
                }
            }
            return;
        };

        if ( $match_users->($obj1_hash) ) {
            if ( $match_rules->($obj2_hash) ) {
                push @$result, $sname;
                next SERVICE;
            }
        }
        if ( $match_users->($obj2_hash) ) {
            if ( $match_rules->($obj1_hash) ) {
                push @$result, $sname;
            }
        }
    }
    return $result;
}

sub service_list {
    my ( $req, $session ) = @_;
    my $owner         = $req->param('active_owner');
    my $relation      = $req->param('relation');
    my $chosen        = $req->param('chosen_networks');
    my $search_own    = $req->param('search_own');
    my $search_used   = $req->param('search_used');
    my $service_lists = load_json("owner/$owner/service_lists");
    my $services      = load_json('services');
    my $result;

    if ($relation) {
        $result = $service_lists->{$relation};
    }
    else {
        my @search_in = ();
        if ( $req->param('search_own') ) {
            push @search_in, 'owner';
        }
        if ( $req->param('search_used') ) {
            push @search_in, 'user';
        }
        if ( $req->param('search_visible') ) {
            push @search_in, 'visible';
        }
        $result = [ sort map { @$_ } @{$service_lists}{@search_in} ];

        # If only terminable services are to be displayed, determine
        # intersection of @$result and services with attribute
        # "disable_at".
        if ( $req->param('search_disable_at') ) {
            push @search_in, 'visible';
            $result =
              [ grep { get_service( $services, $_ )->{details}->{disable_at} }
                  @$result ];
        }
    }

    if ( my ( $obj1_hash, $obj2_hash, $proto_checker ) =
        gen_search_chosen($req) )
    {
        $result = select_services( $req, $result,
            $obj1_hash, $obj2_hash, $proto_checker );
    }
    if ( my ( $obj1_hash, $obj2_hash, $proto_checker ) = gen_search_req($req) )
    {
        $result = select_services( $req, $result,
            $obj1_hash, $obj2_hash, $proto_checker );
    }
    $result = search_string( $req, $result );

    return [
        map {
            my $hash =
              { name => $_, %{ get_service( $services, $_ )->{details} } };

            # Create hash { name => .. } for each owner.
            $hash->{owner} = [ map { { name => $_ } } @{ $hash->{owner} } ];
            $hash;
        } @$result
    ];
}

# Get rules and users of selected service.
# If search is active:
# - one obj_hash:
#  - if users match, then show all rules matching protocol
#  - if users don't match, then show matching rules
# - two obj_hash
#  - if users match first hash, then show rules matching second hash
#  - if users match second hash, then show rules matching first hash
#  - if some users match first, some second and
#    if some rules match first, some second
#    then show all matching rules and users
sub select_rules_and_users {
    my ( $rules, $users, $obj1_hash, $obj2_hash, $proto_checker ) = @_;

    if ( $obj1_hash && $obj2_hash ) {
        my $users1 = select_users( $users, $obj1_hash );
        my $users2 = select_users( $users, $obj2_hash );
        if ( @$users1 && @$users2 ) {
            my $rules1 = select_rules( $rules, 1, $obj1_hash, $proto_checker );
            my $rules2 = select_rules( $rules, 1, $obj2_hash, $proto_checker );
            if ( @$rules1 && @$rules2 ) {
                $rules = [ unique( @$rules1, @$rules2 ) ];
                $users = [ unique( @$users1, @$users2 ) ];
            }
            elsif (@$rules1) {
                $rules = $rules1;
                $users = $users2;
            }
            elsif (@$rules2) {
                $rules = $rules2;
                $users = $users1;
            }
            else {
                $rules = [];
                $users = [];
            }
        }
        elsif (@$users1) {
            $rules = select_rules( $rules, 0, $obj2_hash, $proto_checker );
            $users = $users1;
        }
        elsif (@$users2) {
            $rules = select_rules( $rules, 0, $obj1_hash, $proto_checker );
            $users = $users2;
        }
        else {
            $rules = [];
            $users = [];
        }
    }
    else {
        my $obj_hash = $obj1_hash || $obj2_hash;
        my $users1   = select_users( $users, $obj_hash );
        if ( !@$users1 ) {
            $rules = select_rules( $rules, 0, $obj_hash, $proto_checker );
        }
        else {
            $users = $users1;
            $rules = select_rules( $rules, 0, undef, $proto_checker );
        }
    }
    return ( $rules, $users );
}

sub get_matching_rules_and_users {
    my ( $req, $sname ) = @_;
    my $owner       = $req->param('active_owner');
    my $services    = load_json('services');
    my $sname2users = load_json("owner/$owner/users");
    my $rules       = get_service( $services, $sname )->{rules};
    my $users       = $sname2users->{$sname} || [];
    if ( my ( $obj1_hash, $obj2_hash, $proto_checker ) =
        gen_search_chosen($req) )
    {
        ( $rules, $users ) =
          select_rules_and_users( $rules, $users, $obj1_hash, $obj2_hash,
            $proto_checker );
    }
    if ( my ( $obj1_hash, $obj2_hash, $proto_checker ) = gen_search_req($req) )
    {
        ( $rules, $users ) =
          select_rules_and_users( $rules, $users, $obj1_hash, $obj2_hash,
            $proto_checker );
    }
    return ( $rules, $users );
}

sub get_users {
    my ( $req, $session, $sname ) = @_;
    my $owner = $req->param('active_owner');
    $sname ||= $req->param('service');
    $sname or abort "Missing parameter 'service'";
    my ( $rules, $users ) = get_matching_rules_and_users( $req, $sname );
    return get_nat_obj_list( $users, $owner );
}

sub expand_rules {
    my ( $req,   $sname ) = @_;
    my ( $rules, $users ) = get_matching_rules_and_users( $req, $sname );
    return adapt_name_ip_user( $req, $rules, $users );
}

sub get_rules {
    my ( $req, $session ) = @_;
    my $owner = $req->param('active_owner');
    my $sname = $req->param('service') or abort "Missing parameter 'service'";
    my $lists = load_json("owner/$owner/service_lists");

    # Check if owner is allowed to access this service.
    $lists->{hash}->{$sname} or abort "Unknown service '$sname'";

    return expand_rules( $req, $sname );
}

sub get_services_and_rules {
    my ( $req, $session ) = @_;
    my $expand_users = $req->param('expand_users');
    my $services     = service_list( $req, $session );
    my @result;
    for my $sname ( map { $_->{name} } @$services ) {
        my $rules = expand_rules( $req, $sname );

        # Adapt multi service result.
        for my $rule (@$rules) {
            $rule->{service} = $sname;
            if ( !$expand_users ) {
                $rule->{src} = ['User'] if has_user( $rule, 'src' );
                $rule->{dst} = ['User'] if has_user( $rule, 'dst' );
            }

            # Frontend uses proto instead of prt in this context.
            $rule->{proto} = delete $rule->{prt};
            push @result, $rule;
        }
    }
    return \@result;
}

sub get_own_resources {
    my ( $req, $session ) = @_;
    my $relation = $req->param('relation');
    my $services = service_list( $req, $session );
    my %result;
    for my $sname ( map { $_->{name} } @$services ) {
        my $rules = expand_rules( $req, $sname );
        for my $rule (@$rules) {
            if ( $relation eq 'owner' ) {
                map { $result{$_} = { resource => $_ } } @{ $rule->{src} };
            }
            elsif ( $relation eq 'user' ) {
                map { $result{$_} = { resource => $_ } } @{ $rule->{dst} };
            }
            else {
                last;
            }
        }
    }
    return [ values %result ];
}

sub get_connection_overview {
    my ( $req, $session ) = @_;
    my $display_as = $req->param('display_as');
    my $json       = decode_json( $req->content );
    my $services   = service_list( $req, $session );
    my $result;
    my %res2index = ();    # Hash with indices for added resources
    my $res_index = 0;     # Index of current resource in nodes-array
    my $index;             # Index of source or target in nodes-array
    my @nodes;
    my @edges;

    for my $resource ( @{ $json->{data} } ) {
        if ( $res2index{$resource} ) {
            $res_index = $res2index{$resource};
        }
        else {
            $res_index = scalar @nodes;
            push @nodes,
              {
                id    => $res_index,
                label => $resource
              };
            $res2index{$resource} = $res_index;
        }
        for my $sname ( map { $_->{name} } @$services ) {
            my $rules = expand_rules( $req, $sname );
            my $users = get_users( $req, $session, $sname );
            for my $rule (@$rules) {

                my @ports = map { s/,/ \&/gr } @{ $rule->{prt} };

                #
                # Generate list data
                #
                if ( has_user( $rule, 'both' ) ) {
                    push @$result,
                      {
                        res  => $resource,
                        what => 'BOTH',
                        src  => $resource,
                        dst  => $resource,
                        prt  => join( ',', @ports )
                      };
                }
                else {
                    if ( has_user( $rule, 'src' ) ) {
                        if ( grep { $_ eq $resource } @{ $rule->{dst} } ) {
                            for my $user (@$users) {
                                push @$result,
                                  {
                                    res  => $resource,
                                    what => 'DST',
                                    src  => $user->{ip},
                                    dst  => $resource,
                                    prt  => join( ',', @ports )
                                  };
                                if ( $res2index{ $user->{ip} } ) {
                                    $index = $res2index{ $user->{ip} };
                                }
                                else {
                                    $index = scalar @nodes;
                                    push @nodes,
                                      {
                                        id    => $index,
                                        label => $user->{ip}
                                      };
                                    $res2index{ $user->{ip} } = $index;
                                }
                                push @edges,
                                  {
                                    from   => $res_index,
                                    to     => $index,
                                    arrows => 'from'
                                  };
                            }
                        }
                    }
                    else {
                        if ( grep { $_ eq $resource } @{ $rule->{src} } ) {
                            for my $user (@$users) {
                                push @$result,
                                  {
                                    res  => $resource,
                                    what => 'SRC',
                                    src  => $resource,
                                    dst  => $user->{ip},
                                    prt  => join( ',', @ports )
                                  };
                                if ( $res2index{ $user->{ip} } ) {
                                    $index = $res2index{ $user->{ip} };
                                }
                                else {
                                    $index = scalar @nodes;
                                    push @nodes,
                                      {
                                        id    => $index,
                                        label => $user->{ip}
                                      };
                                    $res2index{ $user->{ip} } = $index;
                                }
                                push @edges,
                                  {
                                    from   => $index,
                                    to     => $res_index,
                                    arrows => 'from'
                                  };
                            }
                        }
                    }
                }
            }
        }
    }

    if ( $display_as eq 'graph' ) {
        return {
            nodes => \@nodes,
            edges => \@edges
        };
    }
    else {
        return $result;
    }
}

################################################################################
#
# Task Email Workflow
#
################################################################################

sub send_template_mail {
    my ( $req, $session, $template, $hash ) = @_;
    my $filename = $config->{template_path} . '/' . $template;
    my $email    = session_email( $req, $session );
    $hash->{email} = $email;
    my $text = fill_in_file( $filename, HASH => $hash );

    my $sendmail = $config->{sendmail_command};

    # -t: read recipient address from mail text
    # -f: set sender address
    # -F: don't use sender full name
    open( my $mail, '|-', "$sendmail -t -F '' -f $config->{noreply_address}" )
      or internal_err "Can't open $sendmail: $!";
    print $mail $text;

    #print $mail Encode::encode('UTF-8', $text);
    close $mail or warn "Can't close $sendmail: $!\n";
    return [];
}

sub send_user_task_mail {
    my ( $req, $session, $template ) = @_;
    my $service          = $req->param('service');
    my $user_object_name = $req->param('user_object_name')
      || '<< Name wird ggf. vom Netzbetrieb oder '
      . 'Dienstanbieter vergeben >>';
    my $user_object_ip = $req->param('user_object_ip')
      || 'Error: empty IP! (form validation failed!?)';
    my $business_unit = $req->param('business_unit')
      || 'Error: no business_unit defined.';
    my $users      = get_users( $req, $session );
    my $services   = load_json("services");
    my $srv_owners = get_service( $services, $service )->{details}->{owner};

    # Hash to fill template with data to send via sendmail.
    my $hash = {
        service          => $service,
        srv_owners       => $srv_owners,
        user_object_name => $user_object_name,
        user_object_ip   => $user_object_ip,
        users            => $users,
        business_unit    => $business_unit
    };
    send_template_mail( $req, $session, $template, $hash );
}

sub service_users {
    my ( $req, $session ) = @_;
    my $users = get_users( $req, $session );
    return [ map { { name => $_->{ip} . "\t" . $_->{name} } } @{$users} ];
}

sub generate_hash_from_json {
    my ($req) = @_;
    my ( @actions, @sources, @dests, @protos );
    my $service    = $req->param('service');
    my $services   = load_json("services");
    my $srv_owners = get_service( $services, $service )->{details}->{owner};
    my $object     = $req->param('object');
    my $what       = $req->param('what');

    use List::Util qw( max );
    use HTML::Strip;

    my $hs           = HTML::Strip->new();
    my $json         = decode_json( $req->content );
    my $stripped_src = trim( $hs->parse( $json->{src} ) );
    my $stripped_dst = trim( $hs->parse( $json->{dst} ) );
    @actions = split /\s*<br>\s*/, $json->{action};
    @sources = split /\s+/,        $stripped_src;
    @dests   = split /\s+/,        $stripped_dst;
    @protos  = split /\s*<br>\s*/, $json->{prt};

    # Determine maximum of entries in src, dst and proto of rule
    my $max = max( scalar @sources, scalar @dests, scalar @protos );

    my $hash = {
        service    => $service,
        srv_owners => $srv_owners,
        what       => $what,
        actions    => \@actions,
        sources    => \@sources,
        dests      => \@dests,
        protos     => \@protos,
        max        => $max,
        object     => $object
    };
}

sub trim { my $s = shift; $s =~ s/^\s+|\s+$//g; return $s }

####################################################################
# Diff
####################################################################

my %text2css = (
    '+' => 'icon-add',
    '-' => 'icon-delete',
    '!' => 'icon-page_edit',
);

my %toplevel_sort = ( objects => 1, services => 2, );

sub get_diff {
    my ( $req, $session ) = @_;
    my $owner   = $req->param('active_owner');
    my $version = $req->param('version')
      or abort "Missing parameter 'version'";
    return [] if $version eq 'none';
    my $changed =
      Policy_Diff::compare( $cache, $version, $selected_history, $owner );
    return [] if not $changed;

    # Convert to ExtJS tree.
    # Node: Hash with attributes "text" and
    # - either "leaf: true"
    # - or "children: [ .. ]"
    # Add css class to special +,-,! nodes.
    # Toplevel: array of nodes
    my $node = sub {
        my ( $text, $childs ) = @_;
        my $result = {};
        if ( my $css = $text2css{$text} ) {
            $result->{iconCls} = $css;
        }
        else {
            $result->{text} = $text;
        }
        if ($childs) {
            $result->{children} = $childs;
        }
        else {
            $result->{leaf} = JSON::true;
        }
        return $result;
    };
    my $convert;
    $convert = sub {
        my ($in) = @_;
        my $type = ref($in);
        if ( not $type ) {
            return $node->($in);
        }
        elsif ( $type eq 'HASH' ) {
            my @result;
            for my $key ( sort keys %$in ) {
                my $val = $convert->( $in->{$key} );
                push @result,
                  $node->( $key, ref($val) eq 'ARRAY' ? $val : [$val] );
            }
            return \@result;
        }
        elsif ( $type eq 'ARRAY' ) {
            return [ map { $convert->($_) } @$in ];
        }
    };
    return [
        sort {
            ( $toplevel_sort{ $a->{text} } || 999 )
              <=> ( $toplevel_sort{ $b->{text} } || 999 )
        } @{ $convert->($changed) }
    ];
}

sub get_diff_mail {
    my ( $req, $session ) = @_;
    my $email = $session->param('email');
    return ( [ { send => JSON::false } ] ) if $email eq 'guest';
    my $owner = $req->param('active_owner');
    my $store = User_Store::new( $config, $email );
    my $aref  = $store->param('send_diff') || [];
    return (
        [
            {
                  send => ( grep { $_ eq $owner } @$aref )
                ? JSON::true
                : JSON::false
            }
        ]
    );
}

sub set_diff_mail {
    my ( $req, $session ) = @_;
    my $email = $session->param('email');
    abort("Can't send diff for user 'guest'") if $email eq 'guest';
    validate_owner( $req, $session, 1 );
    my $owner = $req->param('active_owner');
    my $send  = $req->param('send');
    my $store = User_Store::new( $config, $email );
    my $aref  = $store->param('send_diff') || [];
    my $changed;

    # Javascript truth value is coded as string, because it is transferred
    # as parameter and not as JSON data.
    if ( $send eq 'true' ) {
        if ( !grep { $_ eq $owner } @$aref ) {
            push( @$aref, $owner );
            $changed = 1;
        }
    }
    else {
        $changed = aref_delete( $aref, $owner );
    }
    $store->param( 'send_diff', $aref ) if $changed;
    return ( [] );
}

####################################################################
# Data for about dialog
####################################################################

sub get_about_info {
    my ( $req, $session ) = @_;

    my $vars = { policy_web_version => $version };
    return Template::get( $config->{about_info_template}, $vars );
}

####################################################################
# Save session data
####################################################################

my %saveparam = ( owner => 1 );

sub set_session_data {
    my ( $req, $session ) = @_;
    for my $param ( $req->param ) {
        $saveparam{$param} or abort "Invalid param '$param'";
        my $val = $req->param($param);
        $session->param( $param, $val );
    }
    $session->flush();
    return [];
}

sub get_session_data {
    my ( $req, $session ) = @_;
    return {
        logged_in => $session->param('logged_in') ? JSON::true : JSON::false,
        email => $session->param('email'),
        owner => $session->param('owner'),
    };
}
####################################################################
# Email -> Admin -> Owner
####################################################################

# Find combined owners for user@domain and
# for wildcard [all]@domain which authorizes all users of domain.
sub find_authorized_owners {
    my ($email) = @_;
    my $email2owners = $cache->load_json_current('email');
    my @result;
    my $wildcard = $email =~ s/^.*@/[all]@/r;
    if ( my $owners = $email2owners->{$wildcard} ) {
        @result = @$owners;
    }
    if ( my $owners = $email2owners->{$email} ) {
        @result = unique( @result, @$owners );
    }

    # Force list context for sort.
    @result = sort { lc($a) cmp lc($b) } @result;

    return @result;
}

sub check_email_authorization {
    my ($email) = @_;
    find_authorized_owners($email)
      or abort("Email address '$email' is not authorized");
}

sub can_access_owner {
    my ( $session, $owner ) = @_;
    my $email = $session->param('email');
    return grep { $owner eq $_ } find_authorized_owners($email);
}

# Get currently selected owner.
sub get_owner {
    my ( $req, $session ) = @_;
    my $owner = $session->param('owner');

    # Selected owner was stored before.
    if ( $owner && can_access_owner( $session, $owner ) ) {
        return [ { name => $owner } ];
    }

    # Automatically select owner with most number of own services.
    my $best_owner;
    my $max_size = 0;
    for my $owner ( find_authorized_owners $session->param('email') ) {
        my $service_lists = load_json("owner/$owner/service_lists");
        my $size          = @{ $service_lists->{owner} };
        if ( $size > $max_size ) {
            $max_size   = $size;
            $best_owner = $owner;
        }
    }
    if ($best_owner) {
        $session->param( 'owner', $best_owner );
        return [ { name => $best_owner } ];
    }
    else {
        return [];
    }
}

# Get list of all owners available for current email.
# Return array of hashes { name => $name }
sub get_owners {
    my ( $req, $session ) = @_;
    my $email = $session->param('email');
    return [ map( { { name => $_ } } find_authorized_owners($email) ) ];
}

# Get list of admin emails for given owner.
# If parameter 'owner' is missing, take 'active_owner'.
sub get_admins {
    my ( $req, $session ) = @_;
    my $owner = $req->param('owner') || $req->param('active_owner')
      or abort "Missing param 'owner'";
    if ( $owner eq ':unknown' ) {
        return [];
    }
    return load_json("owner/$owner/emails");
}

# Get list of watcher emails for active owner.
sub get_watchers {
    my ( $req, $session ) = @_;
    my $owner = $req->param('active_owner')
      or abort "Missing param 'active_owner'";
    return load_json("owner/$owner/watchers");
}

# Get list of supervisor owners for active owner.
sub get_supervisors {
    my ( $req, $session ) = @_;
    my $owner = $req->param('active_owner')
      or abort "Missing param 'active_owner'";
    return load_json("owner/$owner/extended_by");
}

# Get sorted list of combined admin and watcher emails
# for given supervisor owner.
sub get_admins_watchers {
    my ( $req, $session ) = @_;
    my $owner = $req->param('owner') or abort "Missing param 'owner'";
    return [
        sort { $a->{email} cmp $b->{email} } (
            @{ load_json("owner/$owner/emails") },
            @{ load_json("owner/$owner/watchers") }
        )
    ];
}

# Return if current user is an admin or watcher for current owner.
sub admin_or_watcher {
    my ( $req, $session ) = @_;
    my $admins = get_admins( $req, $session );
    my %hash;
    map { $hash{ $_->{email} } = 1; } @$admins;
    my $email = session_email( $req, $session );
    return $hash{$email} ? 'admin' : 'watcher';
}

####################################################################
# Register / reset password
####################################################################

sub send_verification_mail {
    my ( $email, $url, $ip ) = @_;
    my $text = Template::get(
        "$config->{mail_template}/verify",
        {
            email => $email,
            url   => $url,
            ip    => $ip
        }
    );
    my $sendmail = $config->{sendmail_command};

    # -t: read recipient address from mail text
    # -f: set sender address
    # -F: don't use sender full name
    open( my $mail, '|-', "$sendmail -t -F '' -f $config->{noreply_address}" )
      or internal_err "Can't open $sendmail: $!";
    print $mail Encode::encode( 'UTF-8', $text );
    close $mail or warn "Can't close $sendmail: $!\n";
    return;
}

# Get / set password for user.
# New password is already encrypted in sub register below.
sub store_password {
    my ( $email, $hash ) = @_;
    my $store = User_Store::new( $config, $email );
    $store->param( 'hash', $hash );
    $store->clear('old_hash');
    $store->flush();
    return;
}

sub check_password {
    my ( $email, $pass ) = @_;
    my $store = User_Store::new( $config, $email );
    my $csh   = Crypt::SaltedHash->new( algorithm => 'SHA-256' );

    # Check password with salted hash.
    if ( my $hash = $store->param('hash') ) {
        return $csh->validate( $hash, $pass );
    }

    # Check against double hashed old password.
    elsif ( my $salted_old_hash = $store->param('old_hash') ) {
        return $csh->validate( $salted_old_hash, md5_hex($pass) );
    }

    # No password known.
    else {
        return;
    }
}

sub register {
    my ( $req, $session ) = @_;
    my $email = $req->param('email') or abort "Missing param 'email'";
    abort("Can't set password for 'guest'") if $email eq 'guest';
    $email = lc $email;
    check_email_authorization($email);
    my $base_url = $req->param('base_url')
      or abort "Missing param 'base_url' (Activate JavaScript)";
    check_attack($req);
    my $token = md5_hex( localtime, $email );
    my $pass  = mkpasswd() or internal_err "Can't generate password";

    # Create salted hash from password.
    my $csh = Crypt::SaltedHash->new( algorithm => 'SHA-256' );
    $csh->add($pass);
    my $hash = $csh->generate;

    # Store hash in session until verification.
    my $reg_data = { user => $email, hash => $hash, token => $token };
    $session->expire( 'register', '1d' );
    $session->param( 'register', $reg_data );
    $session->flush();
    my $url = "$base_url/verify?email=$email&token=$token";

    # Send remote address to the recipient to allow tracking of abuse.
    my $ip = $req->address;
    set_attack($req);
    send_verification_mail( $email, $url, $ip );
    return Template::get(
        "$config->{html_template}/show_passwd",
        { pass => Plack::Util::encode_html($pass) }
    );
}

sub verify {
    my ( $req, $session ) = @_;
    my $email    = $req->param('email') or abort "Missing param 'email'";
    my $token    = $req->param('token') or abort "Missing param 'token'";
    my $reg_data = $session->param('register');
    if (    $reg_data
        and $reg_data->{user} eq $email
        and $reg_data->{token} eq $token )
    {
        store_password( $email, $reg_data->{hash} );
        $session->clear('register');
        $session->flush();
        clear_attack($req);
        return Template::get( "$config->{html_template}/verify_ok", {} );
    }
    else {
        return Template::get( "$config->{html_template}/verify_fail", {} );
    }
}

####################################################################
# Enforce wait time for IP address submitting wrong password
####################################################################
# Wait for 10, 20, 40, .., 300 seconds after submitting wrong password.

sub read_attack_file {
    my ($req) = @_;
    my $ip    = $req->address;
    my $dir   = $config->{session_dir};
    return "$dir/attack-$ip";
}

sub read_attack_count {
    my ($req) = @_;
    my $file = read_attack_file($req);
    open( my $fh, '<', $file ) or return 0;
    my $count = <$fh>;
    close $fh;
    return int($count);
}

sub store_attack_count {
    my ( $req, $count ) = @_;
    my $file = read_attack_file($req);
    open( my $fh, '>', $file ) or return 0;
    printf $fh $count;
    close $fh;
}

sub read_attack_modified {
    my ($req) = @_;
    my $file = read_attack_file($req);
    return ( stat($file) )[9];
}

sub set_attack {
    my ($req) = @_;
    my $count = read_attack_count($req);
    $count++;
    store_attack_count( $req, $count );
}

sub check_attack {
    my ($req)    = @_;
    my $count    = read_attack_count($req) or return;
    my $modified = read_attack_modified($req);
    my $wait     = $count * 10;
    $wait = 120 if $wait > 120;
    my $remain = $modified + $wait - time();
    if ( $remain > 0 ) {
        abort("Wait for $remain seconds after wrong password");
    }
}

sub clear_attack {
    my ($req) = @_;
    my $file = read_attack_file($req);
    unlink $file;
}

####################################################################
# Login
####################################################################

sub set_login {
    my ( $session, $email ) = @_;

    # Set session timeout in minutes.
    # Sanitize config value.
    my $expire = $config->{expire_logged_in};
    ( $expire >= 15 && $expire <= 7 * 24 * 60 ) or $expire = 15;

    $session->param( 'email', $email );
    $session->expire( 'logged_in', "${expire}m" );
    $session->param( 'logged_in', 1 );
    $session->flush();
}

sub login {
    my ( $req, $session ) = @_;
    logout( $req, $session );
    my $email = $req->param('email') or abort "Missing param 'email'";
    $email = lc $email;
    check_email_authorization($email);

    # User 'guest' needs no password.
    if ( $email ne 'guest' ) {
        my $pass = $req->param('pass') or abort("Missing param 'pass'");
        check_attack($req);
        if ( not check_password( $email, $pass ) ) {
            set_attack($req);
            abort('Login failed');
        }
        clear_attack($req);
    }

    set_login( $session, $email );
    my $app_url = $req->param('app') or abort "Missing param 'app'";
    return $app_url;
}

sub login_vue {
    my ( $req, $session ) = @_;
    logout( $req, $session );
    my $email = $req->param('email') or abort "Missing param 'email'";
    $email = lc $email;
    check_email_authorization($email);

    # User 'guest' needs no password.
    if ( $email ne 'guest' ) {
        my $pass = $req->param('pass') or abort("Missing param 'pass'");
        check_attack($req);
        if ( not check_password( $email, $pass ) ) {
            set_attack($req);
            abort('Login failed');
        }
        clear_attack($req);
    }

    set_login( $session, $email );
    return;
}

sub ldap_login {
    my ( $req, $session ) = @_;
    logout( $req, $session );
    my $email = lc ldap_check_pass_get_email($req);
    check_email_authorization($email);
    set_login( $session, $email );
    my $app_url = $req->param('app') or abort "Missing param 'app'";
    return $app_url;
}

sub ldap_login_vue {
    my ( $req, $session ) = @_;
    logout( $req, $session );
    my $email = lc ldap_check_pass_get_email($req);
    check_email_authorization($email);
    set_login( $session, $email );
    return;
}

sub ldap_check_pass_get_email {
    my ($req) = @_;
    my $user  = $req->param('user') or abort "Missing param 'user'";
    my $pass  = $req->param('pass') or abort "Missing param 'pass'";
    check_attack($req);
    my $ldap_uri = $config->{ldap_uri}
      or abort('No LDAP server has been configured');
    if ( $user =~ /[@]/ ) {
        abort('Must not use email address as username');
    }

    # Connect to server, abort on any error.
    my $ldap = Net::LDAP->new( $ldap_uri, onerror => 'undef' )
      or abort "LDAP connect failed: $@";

    # Bind with user account to authenticate.
    my $dn = sprintf( $config->{ldap_dn_template}, $user );
    if ( not $ldap->bind( $dn, password => $pass ) ) {
        set_attack($req);
        abort('Authentication failed');
    }
    clear_attack($req);

    # Search users email address.
    my $email_attr = $config->{ldap_email_attr};
    my $filter     = sprintf( $config->{ldap_filter_template}, $user );
    my $result     = $ldap->search(
        base   => $config->{ldap_base_dn},
        filter => $filter,
        attr   => [$email_attr]
    );

    # Get email from first entry.
    my $entry = ( $result->entries )[0]
      or abort("Can't find email address for '$filter'");
    my $email = $entry->get_value($email_attr);
    $ldap->unbind;
    return $email;
}

sub logged_in {
    my ($session) = @_;
    return $session->param('logged_in');
}

# Validate active owner.
# Email could be removed from any owner role at any time in netspoc data.
sub validate_owner {
    my ( $req, $session, $owner_needed ) = @_;
    if ( my $active_owner = $req->param('active_owner') ) {
        $owner_needed or abort "Must not send parameter 'active_owner'";
        can_access_owner( $session, $active_owner )
          or abort "Not authorized to access owner '$active_owner'";
    }
    else {
        $owner_needed and abort "Missing parameter 'active_owner'";
    }
    return;
}

sub logout {
    my ( $req, $session ) = @_;
    $session->clear('logged_in');
    $session->flush();
    return [];
}

# Find email address for current session.
# This program must ensure that $session->param('email') is only set
# if a user was successfully logged in at least once.
sub session_email {
    my ( $req, $session ) = @_;
    return $session->param('email') || '';
}

####################################################################
# Request handling
####################################################################

my %path2sub = (

    # Default: user must be logged in, JSON data is sent.
    # - anon: anonymous user is allowed
    # - html: send html
    # - redir: send redirect
    # - owner: valid owner and history must be given as CGI parameter
    # - create_cookie: create cookie if no cookie is available
    ldap_login => [
        \&ldap_login,
        {
            anon          => 1,
            redir         => 1,
            create_cookie => 1,
        }
    ],
    ldap_login_vue => [
        \&ldap_login_vue,
        {
            anon          => 1,
            add_success   => 1,
            create_cookie => 1,
        }
    ],
    login => [
        \&login,
        {
            anon          => 1,
            redir         => 1,
            create_cookie => 1,
        }
    ],
    login_vue => [
        \&login_vue,
        {
            anon          => 1,
            add_success   => 1,
            create_cookie => 1,
            err_status    => 401,
        }
    ],
    register => [
        \&register,
        {
            anon          => 1,
            html          => 1,
            create_cookie => 1,
        }
    ],
    verify        => [ \&verify, { anon => 1, html => 1, } ],
    session_email => [
        \&session_email,
        {
            anon       => 1,
            html       => 1,
            err_status => 500
        }
    ],
    get_session_data => [ \&get_session_data, { anon => 1, } ],
    get_policy => [ \&get_policy, { anon        => 1, add_success => 1, } ],
    logout     => [ \&logout,     { add_success => 1, } ],
    get_owner  => [ \&get_owner,  { add_success => 1, } ],
    get_owners => [ \&get_owners, { add_success => 1, } ],
    set        => [ \&set_session_data, { add_success => 1, } ],
    get_about_info  => [ \&get_about_info,  { owner => 1, html        => 1 } ],
    get_history     => [ \&get_history,     { owner => 1, add_success => 1, } ],
    service_list    => [ \&service_list,    { owner => 1, add_success => 1, } ],
    get_admins      => [ \&get_admins,      { owner => 1, add_success => 1, } ],
    get_watchers    => [ \&get_watchers,    { owner => 1, add_success => 1, } ],
    get_supervisors => [ \&get_supervisors, { owner => 1, add_success => 1, } ],
    get_admins_watchers =>
      [ \&get_admins_watchers, { owner => 1, add_success => 1, } ],
    get_rules    => [ \&get_rules,    { owner => 1, add_success => 1, } ],
    get_users    => [ \&get_users,    { owner => 1, add_success => 1, } ],
    get_networks => [ \&get_networks, { owner => 1, add_success => 1, } ],
    get_networks_and_resources =>
      [ \&get_networks_and_resources, { owner => 1, add_success => 1, } ],
    get_services_and_rules =>
      [ \&get_services_and_rules, { owner => 1, add_success => 1, } ],
    get_network_resources =>
      [ \&get_network_resources, { owner => 1, add_success => 1, } ],
    get_own_resources =>
      [ \&get_own_resources, { owner => 1, add_success => 1, } ],
    get_connection_overview =>
      [ \&get_connection_overview, { owner => 1, add_success => 1, } ],
    get_diff         => [ \&get_diff,      { owner => 1, } ],
    get_diff_mail    => [ \&get_diff_mail, { owner => 1, add_success => 1, } ],
    set_diff_mail    => [ \&set_diff_mail, { owner => 1, add_success => 1, } ],
    service_users    => [ \&service_users, { owner => 1, add_success => 1, } ],
    admin_or_watcher =>
      [ \&admin_or_watcher, { owner => 1, add_success => 1, } ],
);

# Change 'param' method of Plack::Request.
# Convert UTF-8 bytes to Perl characters in values.
{

    package UTF8::Plack::Request;
    use base "Plack::Request";

    sub param {
        my ( $self, @arg ) = @_;
        return $self->SUPER::param() if not @arg;
        return Encode::decode_utf8( $self->SUPER::param(@arg) );
    }
}

sub handle_request {
    my ($env) = @_;
    my $req   = UTF8::Plack::Request->new($env);
    my $flags = { html => 1 };
    my $res   = Plack::Response->new(200);

    # Catch errors.
    eval {
        my $cookie = $req->cookies->{CGISESSID};
        $CGI::Session::Driver::file::FileName = "%s";
        my $session = CGI::Session->load( "driver:file", $cookie,
            { Directory => $config->{session_dir} } );
        my $path = $req->path_info();
        $path =~ s:^/::;
        my $info = $path2sub{$path} or abort "Unknown path '$path'";
        ( my $sub, $flags ) = @$info;
        if ( $session->is_empty() ) {
            if ( $flags->{create_cookie} ) {
                $session->new();
            }
            elsif ( $flags->{anon} ) {
                abort "Cookies must be activated";
            }

            # This could happen if the user calls the application URL
            # directly, bypassing the login page.
            # This error message triggers a redirect to the login page.
            else {
                abort "Login required";
            }
        }
        select_history( $req, $flags->{owner} );
        validate_owner( $req, $session, $flags->{owner} );
        $flags->{anon} or logged_in($session) or abort "Login required";
        $res->cookies->{ $session->name } = {
            value   => $session->id,
            path    => '/',
            expires => time + 365 * 24 * 60 * 60
        };
        my $data = $sub->( $req, $session );

        if ( $flags->{html} ) {
            $res->content_type('text/html; charset=utf-8');
            $res->body( Encode::encode( 'UTF-8', $data ) );
        }
        elsif ( $flags->{redir} ) {
            $res->redirect($data);
        }
        else {
            if ( $flags->{add_success} ) {
                if ( ref $data eq 'ARRAY' ) {
                    $data = {
                        totalCount => scalar @$data,
                        records    => $data
                    };
                }
                elsif ($data) {
                    $data = { data => $data, };
                }
                else {
                    $data = {};
                }
                $data->{success} = JSON::true;
            }
            $res->content_type('text/x-json');
            $res->body( to_json( $data, { utf8 => 1, pretty => 1 } ) );
        }
    };
    if ($@) {
        my $msg = $@;
        $msg =~ s/\n$//;
        if ( $flags->{html} or $flags->{redir} ) {

            # Don't use status 500 on all errors, because IE
            # doesn't show error page.
            my $status = $flags->{err_status} || 200;
            $res->status($status);
            $res->content_type('text/html; charset=utf-8');
            my $body = $msg;
            if ( my $page = "$config->{html_template}/error" ) {
                $body = Template::get( $page, { msg => $msg } );
            }
            $res->body($body);
        }
        else {
            my $status = $flags->{err_status} || 500;
            my $result = { success => JSON::false, msg => $msg };
            $res->status($status);
            $res->content_type('text/x-json');
            $res->body( encode_json($result) . "\n" );
        }
    }
    return $res->finalize;
}

####################################################################
# Start server
####################################################################

$config = Load_Config::load();
$cache  = JSON_Cache->new(
    netspoc_data => $config->{netspoc_data},
    max_versions => 8
);

my $app = \&handle_request;

builder {

    # Currently this server runs behind a HTTP proxy.
    enable "XForwardedFor";
    $app;
}
