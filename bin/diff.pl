#!/usr/local/bin/perl

use strict;
use warnings;
use Algorithm::Diff;

use FindBin;
use lib $FindBin::Bin;

# Exportierte Methoden
# - JSON_Cache->new(max_versions => n, netspoc_data => path)
# - $cache->load_json_version($path, $version)
use JSON_Cache;


my $VERSION = ( split ' ',
 '$Id$' )[2];

# Argument processing
sub usage {
    die "Usage: $0 JSON_path yyyy-mm-dd yyyy-mm-dd owner\n";
}

my $path = shift @ARGV or usage();
my $old_ver = shift @ARGV or usage();
my $new_ver = shift @ARGV or usage();
my $owner = shift @ARGV or usage();

#for my $ver ($old_ver, $new_ver) {
#    $ver =~ /^\d\d\d\d-\d\d-\d\d$/ or usage();
#}

sub info { print STDERR "@_\n" }

my $cache;
my %changed;

# Der Wert für die angegebenen Keys ist ein Array mit Namen aus
# 'objects' bzw. 'services'.
# Diese nicht wieder neu prüfen, sondern das Ergebnis abrufen aus $cache.
my %lookup = ( src => 'objects', dst => 'objects', );

# Die Werte der angegebenen Keys nicht untersuchen.
my %ignore = ( sub_owners => 1, name => 1, hash => 1, has_user => 1, nat => 1);

sub diff {
    my ($old, $new, $global) = @_;
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
	    if (my $sub_diff = diff($o_val, $n_val, $global)) {
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
			if (my $diff = diff($o_elt, $n_elt)) {
			    @{$result->{$i}}{keys %$diff} = values %$diff;
			}
		    }
		}
	    }
	    else {
		my $diff = Algorithm::Diff->new($old, $new);
		while($diff->Next()) {
		    if ($diff->Same()) {
			for my $elt ($diff->Same()) {
			    if ($global && compare_global($global, $elt)) {
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
    my ($old, $new) = @_;
    my $result;

    # Iterate over service names.
    # Ignore removed or added services,
    # which are found when comparing service_lists.
  KEY:
    for my $key (keys %$old) {
	my $n_val = $new->{$key} or next;
	my $o_val = $old->{$key};
	my $diff = Algorithm::Diff->new($o_val, $n_val);
	while($diff->Next()) {
	    if ($diff->Same()) {
		for my $elt ($diff->Same()) {
		    if (compare_global('objects', $elt)) {
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
    my ($old, $new) = @_;
    my $result;

    for my $key (qw(owner user)) { # without "visible"
	my $n_val = $new->{$key} || [];
	my $o_val = $old->{$key} || [];
	if (my $diff = diff($o_val, $n_val, 'services')) {
	    $result->{$key} = $diff;
        }
    }
    return $result;
}

# Holds global objects and services hashes in {global} / {services}.
my %old_global;
my %new_global;

sub compare_global {
    my ($path, $key) = @_;
    $changed{$path} ||= {};
    my $hash = $changed{$path};
    return($hash->{$key}) if exists $hash->{$key};

    my $old = $old_global{$path}->{$key};
    my $new = $new_global{$path}->{$key};
    if (not $new) {
	return($hash->{$key} = 'removed');
    }
    elsif (not $old) {
	return($hash->{$key} = 'added');
    }
    else {
	return($hash->{$key} = diff($old, $new));
    }
}

my %path2diff = 
    ( 'users' => \&diff_users,
      'service_lists' => \&diff_service_lists,
      );
	      
sub compare {
    my ($owner, $what) = @_;
    my $path = "owner/$owner/$what";

    my $old_data = $cache->load_json_version($old_ver, $path);
    my $new_data = $cache->load_json_version($new_ver, $path);

    my $sub = $path2diff{$what} or die;
    if (my $diff = $sub->($old_data, $new_data)) {
	$changed{$what} = $diff;
    }
}

$cache = JSON_Cache->new(netspoc_data => $path, max_versions => 8);

# Lade globale Dateien zweier Versionen.
for my $path ( qw(objects services)) {
    $old_global{$path} = $cache->load_json_version($old_ver, $path);
    $new_global{$path} = $cache->load_json_version($new_ver, $path);
}

# Vergleiche Dateien für angegebenen Owner.
for my $what ( qw(service_lists users) ) {
    # assets emails watchers extended_by no_nat_set
    compare($owner, $what);
}

# Clean up auto vivification.
for my $path ( qw(objects services)) {
    my $hash = $changed{$path};
    if ($hash and not keys %$hash) {
	delete $changed{$path};
    }
    else {
        for my $key (keys %$hash) {
            $hash->{$key} or delete $hash->{$key};
        }
        not keys %$hash and delete $changed{$path};
    }
}


use Data::Dumper;
if (%changed) {
    print "$owner ";
    print Dumper(\%changed);
}

exit;
for my $path (sort keys %changed) {
    print "$path\n";
    print Dumper($changed{$path});
}
