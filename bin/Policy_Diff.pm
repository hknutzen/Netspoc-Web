package Policy_Diff;

# Provides public function "compare".

use strict;
use warnings;
use Carp;
use Algorithm::Diff;

our $VERSION = ( split ' ',
 '$Id$' )[2];

# Der Wert für die angegebenen Keys ist ein Array mit Namen aus
# 'objects' bzw. 'services'.
# Diese nicht wieder neu prüfen, sondern das Ergebnis abrufen aus $cache.
my %lookup = ( src => 'objects', dst => 'objects', );

# Die Werte der angegebenen Keys nicht untersuchen.
my %ignore = ( sub_owners => 1, name => 1, hash => 1, has_user => 1, nat => 1);

sub compare_global {
    my ($state, $path, $key) = @_;
    my $cache = $state->{diff_cache};
    $cache->{$path} ||= {};
    my $hash = $cache->{$path};
    return($hash->{$key}) if exists $hash->{$key};

    my ($data, $v1, $v2) = @{$state}{qw(data v1 v2)};
    my $old = $data->load_json_version($v1, $path)->{$key};
    my $new = $data->load_json_version($v2, $path)->{$key};
    if (not $new) {
	return($hash->{$key} = 'removed');
    }
    elsif (not $old) {
	return($hash->{$key} = 'added');
    }
    else {
	return($hash->{$key} = diff($state, $old, $new));
    }
}

sub diff {
    my ($state, $old, $new, $global) = @_;
    my $result;

    my $type = ref($old);
    if (not $type) {
	if ($old ne $new) {
	    $result = "$old => $new";
	}
    }
    elsif ($type eq 'HASH') {
	for my $key (keys %$old) {
	    next if $ignore{$key};

	    # Key has been removed in new version.
	    if (not exists($new->{$key})) {
		$result->{$key} = 'removed';
		next;
	    }
	    my $n_val = $new->{$key} || '';
	    my $o_val = $old->{$key} || '';
	    my $global = $lookup{$key};
	    if (my $sub_diff = diff($state, $o_val, $n_val, $global)) {
		$result->{$key} = $sub_diff;
	    }
	}

	# Key has been added in new version.
	for my $key (keys %$new) {
	    next if $ignore{$key};
	    exists($old->{$key}) or $result->{$key} = 'added';
	}
    }
    elsif ($type eq 'ARRAY') {
	if (@$old or @$new) {
	    my $is_ref = @$old 
		       ? ref($old->[0]) 
		       : @$new 
		       ? ref($new->[0]) 
		       : 0;
	    if ($is_ref) {
		if (@$new - @$old) {
		    $result = 'changed';
		}
		else {
		    for (my $i = 0; $i < @$old; $i++) {
			my $o_elt = $old->[$i];
			my $n_elt = $new->[$i];
			if (my $diff = diff($state, $o_elt, $n_elt)) {
			    @{$result->{$i}}{keys %$diff} = values %$diff;
			}
		    }
		}
	    }
	    else {
		my $diff = Algorithm::Diff->new($old, $new);
		while($diff->Next()) {
		    if ($diff->Same()) {
                        next if not $global;
			for my $elt ($diff->Same()) {
			    if (compare_global($state, $global, $elt)) {
				push(@{ $result->{changed} }, $elt);
			    }
			}
		    }
		    else {
			if($diff->Items(1)) {
			    push(@{ $result->{removed} }, $diff->Items(1));
			}
			if($diff->Items(2)) {
			    push(@{ $result->{added} }, $diff->Items(2));
			}
		    }
		}
	    }
	}
    }
    return $result;
}

# Parameter sind zwei Hashes mit
# Key: Service Name
# Value: Array von Objekt-Namen.
#
# Resultat:
# Hash, der Unterschiede beschreibt.
# Key: Service Name
# Value: String, der 1. Unterschied der Arrays beschreibt.
sub diff_users {
    my ($state, $old, $new) = @_;
    my $result;

    # Iterate over service names.
    # Ignore removed or added services,
    # which are found when comparing service_lists.
  KEY:
    for my $key (keys %$old) {

        # Lists of object names.
	my $n_val = $new->{$key} or next;
	my $o_val = $old->{$key};
	my $diff = Algorithm::Diff->new($o_val, $n_val);
	while($diff->Next()) {
	    if ($diff->Same()) {
		for my $elt ($diff->Same()) {
		    if (compare_global($state, 'objects', $elt)) {
			push(@{ $result->{$key}->{changed} }, $elt);
		    }
		}
	    }
	    else {
		if($diff->Items(1)) {
		    push(@{ $result->{$key}->{deleted} }, $diff->Items(1));
		}
		if($diff->Items(2)) {
		    push(@{ $result->{$key}->{added} }, $diff->Items(2));
		}
	    }
	}
    }
    return $result;
}

sub diff_service_lists {
    my ($state, $old, $new) = @_;
    my $result;

    for my $key (qw(owner user)) { # without "visible"

        # Lists of service names.
	my $n_val = $new->{$key} || [];
	my $o_val = $old->{$key} || [];
	if (my $diff = diff($state, $o_val, $n_val, 'services')) {
	    $result->{$key} = $diff;
        }
    }
    return $result;
}

my %path2diff = 
    ( 'users' => \&diff_users,
      'service_lists' => \&diff_service_lists,
      );

# Public function of this package.
sub compare {
    my ($cache, $v1, $v2, $owner) = @_;
    my $result;
    
    # Put data needed in compare_global into one hash.
    # Cache results in diff_cache.
    my $state = {
        data => $cache,
        v1 => $v1,
        v2 => $v2,
        diff_cache => {},
    };
    for my $what ( qw(service_lists users) ) {
        my $path = "owner/$owner/$what";

        my $old_data = $cache->load_json_version($v1, $path);
        my $new_data = $cache->load_json_version($v2, $path);

        my $sub = $path2diff{$what} or die;
        if (my $diff = $sub->($state, $old_data, $new_data)) {
            $result->{$what} = $diff;
        }
    }

    # Add changed objects and services to result.
    # Ignore auto vivification.
    my $global_diff = $state->{diff_cache};
    for my $what ( qw(objects services) ) {
        my $hash = $global_diff->{$what};
        if ($hash and not keys %$hash) {
            next;
        }
        else {
            for my $key (keys %$hash) {
                $hash->{$key} or delete $hash->{$key};
            }
            not keys %$hash and next;
        }
        $result->{$what} = $hash;
    }

    # Change result: {service_list}->{$key} to {"service_list $key"}
    if (my $hash = delete $result->{service_lists}) {
        for my $key (keys %$hash) {
            $result->{"service_lists $key"} = $hash->{$key};
        }
    }

    return $result;
}

1;
