
=head1 COPYRIGHT AND DISCLAIMER

(C) 2022 by Heinz Knutzen     <heinz.knutzen@gmail.com>
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

package JSON_Cache;

use strict;
use warnings;
use Carp;
use JSON;
use Encode;
use open qw(:std :utf8);

# Exported methods
# - sub load_json_version($version, $path)
# - sub load_json_current($path)
# - sub store_cache_version($version, $key, $data, $context)
# - sub load_cache_version($version, $key, $context)

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
    elsif ($path =~ m|/nat_set$|) {

        # Input: Array with nat_tags.
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

    # elsif ($path =~/services$/) {

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
	#          prt => [ "ip|tcp|tcp 80|udp 60-70|...", ..] },
	#        ..]},
	#   ..}
    # }

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
#   - a date YYYY-MM-DD to retrieve files of given date from
#     a sub directory in directory "history".
#   - a policy pxxxx to retrive files from a sub directory
# - path, pathname of file to retrieve.
sub load_json_version {
    my ($self, $version, $path) = @_;

    # Last access time for data of this version.
    $self->{atime}->{$version} = time();
    my $data;

    if (not exists $self->{cache}->{$version}->{$path}) {
        $self->clean_cache();
        my $dir = $self->{netspoc_data};

        # History of some date.
        if ($version =~ /^\d\d\d\d-\d\d-\d\d$/) {
            $dir = "$dir/history";
        }

        my $real_path = "$dir/$version/$path";
        my $u8_real_path = Encode::encode('UTF-8', $real_path);
        open (my $fh, '<', $u8_real_path) or
            die "Can't open $real_path: $!";
        local $/ = undef;
        $data = from_json( <$fh> );
        close($fh);
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
    my $link = "$self->{netspoc_data}/current";
    my $policy = readlink $link or die "Can't read symlink $link";
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
