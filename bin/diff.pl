#!/usr/local/bin/perl

=head1 NAME

diff.pl - Print names of owners that have changes.

=head1 COPYRIGHT AND DISCLAIMER

(C) 2014 by Heinz Knutzen     <heinz.knutzen@gmail.com>
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

use FindBin;
use lib $FindBin::Bin;

use JSON_Cache;
use Policy_Diff;

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
    if ($changes) {
        print "$owner\n";
    }
}
