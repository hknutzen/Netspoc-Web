#!/usr/local/bin/perl

use strict;
use warnings;

use FindBin;
use lib $FindBin::Bin;

use JSON_Cache;
use Policy_Diff;

my $VERSION = ( split ' ',
 '$Id$' )[2];

# Argument processing
sub usage {
    die "Usage: $0 JSON_path yyyy-mm-dd yyyy-mm-dd|pxxx\n";
}

my $path = shift @ARGV or usage();
my $old_ver = shift @ARGV or usage();
my $new_ver = shift @ARGV or usage();
@ARGV and usage();


# Cache holding JSON data.
my $cache = JSON_Cache->new(netspoc_data => $path, max_versions => 8);

# Bestimme alle aktiven owner.
my $email2owners = $cache->load_json_version($new_ver, 'email');
my %owners;
for my $aref (values %$email2owners) {
    for my $owner (@$aref) {
	$owners{$owner} = $owner;
    }
}

# Vergleiche Dateien für jeden Owner.
for my $owner (sort keys %owners) {
    my $changes = Policy_Diff::compare($cache, $old_ver, $new_ver, $owner);
    if ($changes && keys %$changes) {
        print "$owner\n";
    }
}
