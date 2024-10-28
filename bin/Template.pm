
=head1 COPYRIGHT AND DISCLAIMER

(C) 2014 by Heinz Knutzen     <heinz.knutzen@gmail.com>

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

package Template;

use strict;
use warnings;
use Carp;

# Input from template files is encoded in utf8.
# Output is explicitly sent as utf8.
use open IN => ':utf8';

sub read_file {
    my ($file) = @_;
    open( my $fh, '<', $file ) or croak "Can't open $file: $!";
    local $/ = undef;
    my $text = <$fh>;
    close $fh;
    return $text;
}

# Do simple variable substitution.
# Use syntax of template toolkit.
sub process {
    my ( $text, $vars ) = @_;
    while ( my ( $key, $value ) = each %$vars ) {
        $text =~ s/\[% $key %\]/$value/g;
    }
    return $text;
}

sub get {
    my ( $file, $vars ) = @_;
    my $text = read_file($file);
    $text = process( $text, $vars );
    return $text;
}

1;
