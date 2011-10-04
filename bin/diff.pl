#!/usr/local/bin/perl

use strict;
use warnings;

use FindBin;
use lib $FindBin::Bin;

# Exportierte Methoden
# - JSON_Cache->new(max_versions => n, netspoc_data => path)
# - $cache->load_json_version($path, $version)
use JSON_Cache;
use Policy_Diff;

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


# Cache holding JSON data.
my $cache = JSON_Cache->new(netspoc_data => $path, max_versions => 8);

# Vergleiche Dateien für angegebenen Owner.
my $changed = Policy_Diff::compare($cache, $old_ver, $new_ver, $owner);


use Data::Dumper;
if ($changed) {
    print "$owner ";
    print Dumper($changed);
}
