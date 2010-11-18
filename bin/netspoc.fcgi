#!/usr/local/bin/perl -I /home/heinz/Netspoc/misc

use strict;
use warnings;
use ReloadingFCGI;
use JSON;
use CGI::Simple;
use Readonly;
use Netspoc;

# Constants.
Readonly::Scalar my $NETSPOC_DATA => '/home/heinz/netspoc';

# Global variables.
my $program = "Netspoc JSON service";
my $VERSION = ( split ' ',
 '$Id$' )[2];

sub is_numeric { 
    my ($value) = @_;
    $value =~ /^\d+$/; 
}

sub ip_for_object {
    my ($object) = @_;
    if ( Netspoc::is_network( $object ) ) {
	if ( is_numeric($object->{ip}) ) {
	    return print_ip($object->{ip});
	}
    }
    elsif ( Netspoc::is_host( $object ) ) {
	if ( my $range = $object->{range} ) {
	    return join '-', map { print_ip( $_ ) } @$range;
	}
	else {
	    return print_ip($object->{ip});
	}
    }
    elsif ( Netspoc::is_interface( $object ) ) {
	if ( is_numeric( $object->{ip} ) ) {
	    return print_ip( $object->{ip} );
	}
    }
    elsif ( Netspoc::is_any( $object ) ) {
	return print_ip( 0 );
    }
    else {
	warn "NO IP FOR $object->{name}";
    }
    return;
}

my %unknown;
# Check if all arguments are 'eq'.
sub equal {
    return 1 if not @_;
    my $first = $_[0];
    return not grep { $_ ne $first } @_[ 1 .. $#_ ];
}

sub owners_for_objects {	
    my ($objects) = @_;
    my %owners;
    for my $object ( @$objects ) {
	my $name;
	my $owner_obj;
	$owner_obj = $object->{owner};
	if ($owner_obj) {
	    ($name = $owner_obj->{name}) =~ s/^owner://;
	}
	if (not $name) {
	    $name = 'unknown';
	    $unknown{$object->{name}} = 1;
	}
	$owners{$name} = $name;
    }
    return [ values %owners ];
}

sub expand_auto_intf {
    my ($src_aref, $dst_aref) = @_;
    for (my $i = 0; $i < @$src_aref; $i++) {
	my $src = $src_aref->[$i];
	next if not is_autointerface($src);
	my @new;
	for my $dst (@$dst_aref) {
	    push @new, Netspoc::path_auto_interfaces($src, $dst);
	}

	# Substitute auto interface by real interface.
	splice(@$src_aref, $i, 1, @new)
    }
}


sub find_visibility {
    my ($owners, $uowners) = @_;
    $owners = [ grep { $_ ne 'unknown' } @$owners ];
    $uowners = [ grep { $_ ne 'unknown' } @$uowners ];
    my $visibility;
    my %hash = map { $_ => 1} @$owners;
    my @extra_uowners = grep { not $hash{$_} } @$uowners;
    my @DA_extra = grep({ $_ =~ /^DA_/ } @extra_uowners);
    my @other_extra = grep({ $_ !~ /^DA_/ } @extra_uowners);
			   
    # No known owner or owner of users.
    if (not @$owners and not @$uowners) {
	$visibility = [ 'none' ];
    }
    # Set of uowners is subset of owners.
    elsif (not @extra_uowners) {
	$visibility = [ 'private' ];
    }
    # Restricted visibility
    elsif (@other_extra <= 2) {
	$visibility = [];
	if (@DA_extra >= 3) {
	    push @$visibility, 'DA_*';
	}
	else {
	    push @$visibility, 'DA-'.@DA_extra if @DA_extra;
	}
	push @$visibility, 'priv-'.@other_extra;
    }
    else {
	$visibility = [ 'public' ];
    }
    join(',', @$visibility);	
}

my $policy_info;

sub setup_policy_info {
    Netspoc::info("Setup policy info");
    for my $key (sort keys %policies) {
	my $policy = $policies{$key};
	my $pname = $policy->{name};

	my $users = Netspoc::expand_group($policy->{user}, "user of $pname");

	# Non 'user' objects.
	my @objects;

	# Check, if policy contains a coupling rule with only "user" elements.
	my $is_coupling = 0;

	for my $rule (@{ $policy->{rules} }) {
	    my $has_user = $rule->{has_user};
	    if ($has_user eq 'both') {
		$is_coupling = 1;
		next;
	    }
	    for my $what (qw(src dst)) {
		next if $what eq $has_user;
		push(@objects, @{ Netspoc::expand_group($rule->{$what}, 
							"$what of $pname") });
	    }
	}

	# Expand auto interface to set of real interfaces.
	expand_auto_intf(\@objects, $users);
	expand_auto_intf($users, \@objects);

	# Take elements of 'user' object, if policy has coupling rule.
	if ($is_coupling) {
	    push @objects, @$users;
	}

	# Remove duplicate objects;
	my %objects = map { $_ => $_ } @objects;
	@objects = values %objects;

	# Find IPs and owner for @objects.
	$pname =~ s/policy://;
	my $all_ips = [ map { ip_for_object($_) } @objects ];

	my $owners = $policy->{owners};
	my $owner = join (',', map { $_->{name} } @$owners);
	$owner = "multi:$owner" if keys @$owners > 1;
	$owner = "coupling:$owner" if $is_coupling;

	my $uowners = $is_coupling ? [] : owners_for_objects($users);
	my $uowner = join (',', @$uowners);

	# Find visibility for each policy.
	my $visibility = find_visibility($owners, $uowners);

	$policy_info->{$pname} = {
	    name => $pname,
	    ips => $all_ips,
	    owner => $owner,
	    uowner => $uowner,
	    visibility => $visibility,
	};
    }
    $policy_info->{unknown} = {
	name => 'unknown',
	unknown => [ keys %unknown ],
	ucount => scalar keys %unknown,
    };
}

####################################################################
# Handle FCGI requests, serving back json for URL requests.
####################################################################

sub search {
    my ($type, $crit) = @_;
    my $result = [];
    for my $key ( sort keys %{$policy_info} ) {
	my $value = $policy_info->{$key};
	if ( $value->{$type} =~ /$crit/ ) {
	    push @$result, $value;
	}
    }
    return $result;
}

sub create_search_sub {
    my ($type) = @_;
    return sub {
	my ($cgi) = @_;
	my $crit = $cgi->param( 'criteria' ) || '.*';
	my $result = search($type, $crit);
	return {
	    success => 'true',
	    totalCount => scalar @$result,
	    records => $result
	    };
    }
}

####################################################################
# Email -> Admin -> Owner
####################################################################
my %email2admin;
my %admin2owners;

sub setup_admin2owners {
    for my $name ( keys %owners ) {
	my $owner = $owners{$name};
	for my $admin ( @{$owner->{admins}} ) {
	    my $admin_email = $admin->{email};
	    $admin2owners{$admin_email}->{$name} = 1;
	}
    }
}

sub setup_email2admin {
    for my $admin ( values %admins ) {
	$email2admin{$admin->{email}} = $admin;
    }
}

sub find_admin {
    my ($cgi) = @_;
    my $user = $cgi->param( 'user' );
    my $admin = $email2admin{$user} or
	return error_data("Unknown admin '$user'");
#    my $pass = $cgi->param( 'pass' );
#    return unless $admin->{pass} eq $pass;
    my $owner_hash = $admin2owners{$user};
    return { owner => [ keys %$owner_hash ] };
}


####################################################################
# FCGI request handling
####################################################################
my %path2sub = 
    ( '/owner'      => create_search_sub( 'owner' ),
      '/service'    => create_search_sub( 'name' ),
      '/ips'        => create_search_sub( 'ips' ),
      '/visibility' => create_search_sub( 'visibility' ),
      '/user'       => \&find_admin,

      # For testing purposes.
      '/test'   => sub { my ($cgi) = @_; return { params => $cgi->raw()  } },
      ); 

sub handle_request {
    my $request = shift;
    local *STDIN; open STDIN, '<', \$request->read_stdin;
    local %ENV = %{$request->params};

    my $cgi = CGI::Simple->new;
    my $path = $cgi->path_info();
    my $sub = $path2sub{$path};
    my $data = $sub 
	     ? $sub->($cgi) || return
	     : error_data("Unknown path '$path'");
    $request->respond(
#		      encode_json($data),
		      to_json($data, {utf8 => 1, pretty => 1}), 
		      'Content-Type' => 'application/x-json');
}

sub error_data {
    my ($msg) = @_;
    return { success => 'false',
	     msg => $msg,
	 };
}

####################################################################
# Initialize Netspoc data
####################################################################
sub init_data {
    read_file_or_dir( $NETSPOC_DATA );
    order_services();
    link_topology();
    mark_disabled();
    distribute_nat_info();
    find_subnets();
    setany();
    setpath();
    set_policy_owner();
    setup_admin2owners();
    setup_email2admin();
    setup_policy_info();
    Netspoc::info("Ready");
}

####################################################################
# Start server
####################################################################
init_data();
ReloadingFCGI->run
    (
     reload_fifo => '/home/heinz/policy-shop/reload.socket',
     daemonize => 0,
     fcgi_socket =>'/var/lib/apache2/fastcgi/test.sock',
     request_handler => \&handle_request,
     );
