package JSON_Cache;

use strict;
use warnings;
use Carp;
use JSON;
use Encode;
use open qw(:std :utf8);

our $VERSION = ( split ' ',
 '$Id$' )[2];


# Exported method
# - sub load_json_version($path, $version)
# - sub load_json_current($path)
# - sub store_cache_version($version, $path, $data)
# - sub load_cache_version($version, $path)

# Creates a new JSON_Cache object.
#
# Store data of file or RCS revision in memory.
# Data is partially postprocessed after first loading.
#
# Internal attributes:
# - cache->{$version}->{$path} = $data
# - atime->{$version} = <last access time>
sub new {
    my ($class, %attributes) = @_;
    $attributes{max_versions} or croak "Missing attribute 'max_versions'";
    $attributes{netspoc_data} or croak "Missing attribute 'netspoc_data'";
    return bless \%attributes, $class;
}

# Remove least recently used versions which exceed max_versions.
sub clean_cache {
    my ($self) = @_;
    my $cache = $self->{cache};
    return if keys %$cache <= $self->{max_versions};
    
    # Sort version keys, least use comes first.
    my $atime = $self->{atime};
    my @versions_by_atime = 
	sort { $atime->{$a} <=> $atime->{$b} } keys %$cache;
    my $delete_to = @versions_by_atime - $self->{max_versions} - 1;
    delete @{$cache}{ @versions_by_atime[0..$delete_to] };
    return;
}

sub postprocess_json {
    my ($self, $path, $data) = @_;
    if ($path =~ /objects$/) {

	# Add attribute 'name' to each object.
	for my $name (keys %$data) {
	    $data->{$name}->{name} = $name;
	}
    }
    elsif ($path =~ m/no_nat_set$/) {

	# Input: Array with no_nat_tags.
	# Change array to hash.
	$data = { map { $_ => 1 } @$data };
    }
    elsif ($path =~ m/service_lists$/) {

	# Input: Hash with owner|user|visible => [ service_name, ..]
	# Add hash with all service names as keys.
        my %hash;
        for my $key (keys %$data) {
            my $snames = $data->{$key};
            @hash{@$snames} = ($key) x @$snames;
        }
        $data->{hash} = \%hash;
    }
    elsif ($path =~/services$/) {

	# Input: Hash mapping service names to details and rules.
	# { s1 => { 
	#      details => {
	#           description => "Text",
	#           owner => [owner1, .. ] | [":unknown"],
	#           sub_owners => [ owner2, ..] },
	#      rules => [
	#        { src => [ object_names, ..],
	#          dst => [ object_names, ..],
	#          action => "permit|deny",
	#          has_user => "src|dst|both",
	#          srv|prt => [ "ip|tcp|tcp 80|udp 60-70|...", ..] },
	#        ..]},
	#   ..}

        # Sort protocols again. 
        # Protocols are sorted already by export.pl, 
        # but some old history files are still sorted lexicographically.
        # 1. by protocol type icmp, ip, proto, tcp, udp
        # 2. by first number (port or type)
        # 3. by remaining characters
        # using Schwarzian transformation
        for my $service (values %$data) {
            for my $rule (@{ $service->{rules} }) {
                $rule->{prt} = [
                    map  { $_->[0] }
                    sort { $a->[1] cmp $b->[1] || 
                           $a->[2] <=> $b->[2] ||
                           $a->[3] cmp $b->[3] }
                    map  { my($p, $n, $r) = m/^(\w+) ?(\d*)(.*)/;
                           [ $_, $p, $n || 0, $r || '' ] }

                    # Support old key {srv} in history files,
                    # but delete it to not confuse Policy_Diff.
                    @{ $rule->{prt} || delete($rule->{srv}) } ];
            }
        }        
    }

    # elsif ($path =~ m/users$/) {

	# Input: Hash mapping service names to user objects.
	# { s1 => [ o1, ..], ..}
    # }

    elsif ($path =~ /assets$/) {

	# Input: Hash with
	# { anys => {a1 => { networks => {n1 => [h1,i1, ..],
	#                                 ..}
	######                    interfaces => [i1, ..]},
	#            ..},
	######   routers => {r1 => [i1, ..],
	#               ..}}
	# Add attribute 'net2childs' with flattened networks hashes 
	# of all any objects.
	my $anys = $data->{anys};
	$data->{net2childs} = { map { %{ $_->{networks} } } values %$anys };

	# Add attribute 'any_list' with names of 'any' objects.
	$data->{any_list} = [ keys %$anys ];

	# Add attribute 'network_list' with names of network objects.
	$data->{network_list} = [ keys %{ $data->{net2childs} } ];
    }
    return $data;
}

# Parameters
# - version, 
#   - a date YYYY-MM-DD to retrieve files of given date from RCS.
#   - a policy pxxxx to retrive files from this sub directory
# - path, pathname of file to retrieve.
sub load_json_version {
    my ($self, $version, $path) = @_;

    # Last access time for data of this version.
    $self->{atime}->{$version} = time();
    my $data;

    if (not exists $self->{cache}->{$version}->{$path}) {
	$self->clean_cache();
	my $fh;
	my $dir = $self->{netspoc_data};

        # Catch errors rcs/file/JSON errors, if old or new version
        # doesn't exist or JSON file is empty.
        eval {

            # Check out from RCS revision of some date.
            if ($version =~ /^\d\d\d\d-\d\d-\d\d$/) {
                my $cmd = "co -q -p -d'$version 23:59' -zLT $dir/RCS/$path,v";
                my $u8_cmd = Encode::encode('UTF-8', $cmd);
                open ($fh, '-|', $u8_cmd) or die "Can't open $cmd: $!\n";
            }

            # Get selected policy from today.
            elsif ($version =~ /^p\d{1,8}$/) {
                my $real_path = "$dir/$version/$path";
                my $u8_real_path = Encode::encode('UTF-8', $real_path);
                open ($fh, '<', $u8_real_path) or die "Can't open $real_path\n";
            }
            else {
                die "Internal: Invalid version requested";
            }
            {
                local $/ = undef;
                $data = from_json( <$fh> );
            }
            close($fh);
        };
	$data = $self->postprocess_json($path, $data);
	$self->{cache}->{$version}->{$path} = $data;
    }
    else {
        $data = $self->{cache}->{$version}->{$path};
    }
    return $data;
}

sub load_json_current {
    my ($self, $path) = @_;
    my $policy_path = "$self->{netspoc_data}/current/POLICY";
    my $policy = qx(cat $policy_path);
    $policy =~ m/^# (\S+)/ or 
        die "Internal: Can't find policy name in $policy_path";
    $policy = $1;
    return $self->load_json_version($policy, $path);
}

sub store_cache_version {
    my ($self, $version, $key, $data, $context) = @_;

    # Last access time for data of this version.
    $self->{atime}->{$version} = time();
    $self->clean_cache();

    $context ||= 1;
    $self->{cache}->{$version}->{':context'}->{$key} = $context;
    return $self->{cache}->{$version}->{':store'}->{$key} = $data;
}

sub load_cache_version {
    my ($self, $version, $key, $context) = @_;

    # Last access time for data of this version.
    $self->{atime}->{$version} = time();

    $context ||= 1;
    if (my $old =$self->{cache}->{$version}->{':context'}->{$key}) {
        $old eq $context or return;
    }
    return $self->{cache}->{$version}->{':store'}->{$key};
}

1;
