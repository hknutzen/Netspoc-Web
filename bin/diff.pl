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
    die "Usage: $0 JSON_path yyyy-mm-dd yyyy-mm-dd\n";
}

my $path = shift @ARGV or usage();
my $old_ver = shift @ARGV or usage();
my $new_ver = shift @ARGV or usage();

#for my $ver ($old_ver, $new_ver) {
#    $ver =~ /^\d\d\d\d-\d\d-\d\d$/ or usage();
#}

my $cache;
my %changed;

# Der Wert für die angegebenen Keys ist ein Array mit Namen aus
# 'objects' bzw. 'services'.
# Diese nicht wieder neu prüfen, sondern das Ergebnis abrufen aus xxx.
my %lookup = ( src => 'objects', dst => 'objects',
	       owner => 'services', user => 'services', visible => 'services',
	       );

# Die Werte der angegebenen Keys nicht untersuchen.
my %ignore = ( sub_owners => 1, name => 1, hash => 1,);

sub diff;
sub diff {
    my ($old, $new) = @_;
    my $result;
  KEY:
    for my $key (keys %$old) {
	next if $ignore{$key};

	# Key has been removed in new version.
	if (not exists($new->{$key})) {
	    $result->{$key} = 'removed';
	    next;
	}
	my $n_val = $new->{$key} || '';
	my $o_val = $old->{$key} || '';
	my $type = ref($o_val);
	if (not $type) {
	    if ($o_val ne $n_val) {
		$result->{$key} = 'changed';
	    }
	}
	elsif ($type eq 'HASH') {
	    if (my $sub_diff = diff($o_val, $n_val)) {
		$result->{$key} = $sub_diff;
	    }
	}
	elsif ($type eq 'ARRAY') {
	    next if not @$o_val and not @$n_val;
	    my $is_ref = @$o_val 
		       ? ref($o_val->[0]) 
		       : @$n_val 
		       ? ref($n_val->[0]) 
		       : 0;
	    if ($is_ref) {
		if (my $diff = @$n_val - @$o_val) {
		    $result->{$key} = ($diff > 0)
				    ? "incremented by $diff"
				    : ("decremented by " . -$diff);
		    next;
		}
		for (my $i = 0; $i < @$o_val; $i++) {
		    my $o_elt = $o_val->[$i];
		    my $n_elt = $n_val->[$i];
		    if (my $diff = diff($o_elt, $n_elt)) {
			@{$result->{$key}->{$i}}{keys %$diff} = values %$diff;
		    }
		}
		next;
	    }
		    
	    my $global = $lookup{$key};
	    my $diff = Algorithm::Diff->new($o_val, $n_val);
	    while($diff->Next()) {
		if ($diff->Same()) {
		    for my $elt ($diff->Same()) {
			if ($global && $changed{objects}->{$elt}) {
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
    }

    # Key has been added in new version.
    for my $key (keys %$new) {
	next if $ignore{$key};
	exists($old->{$key}) or $result->{$key} = 'added';
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
		    if ($changed{objects}->{$elt}) {
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
	
sub compare {
    my ($path) = @_;
    
    my $old_data = $cache->load_json_version($old_ver, $path);
    my $new_data = $cache->load_json_version($new_ver, $path);

    if (my $diff = $path =~ m|/users$| 
	         ? diff_users($old_data, $new_data)
	         : diff($old_data, $new_data)) 
    {
	$changed{$path} = $diff;
    }
}

$cache = JSON_Cache->new(netspoc_data => $path, max_versions => 8);

# Lade und vergleiche globale Dateien zweier Versionen.
for my $path ( qw(objects services)) {
    compare($path);
}

# Bestimme alle aktiven owner.
my $email2owners = $cache->load_json_version($new_ver, 'email');
my %owners;
for my $aref (values %$email2owners) {
    for my $owner (@$aref) {
	$owners{$owner} = $owner;
    }
}

# Vergleiche Dateien für jeden Owner.
for my $owner (values %owners) {
    for my $what ( qw(service_lists users) ) {
	# assets emails watchers extended_by no_nat_set
	my $path = "owner/$owner/$what";
	compare($path);
    }
}

# Clean up auto vivification.
for my $path ( qw(objects services)) {
    my $value = $changed{$path};
    if ($value and not %$value) {
	delete $changed{$path};
    }
}


use Data::Dumper;
print Dumper(\%changed);
exit;
for my $path (sort keys %changed) {
    print "$path\n";
    print Dumper($changed{$path});
}
