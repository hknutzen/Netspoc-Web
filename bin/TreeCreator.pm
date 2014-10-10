
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

package TreeCreator;

# Provides public function "create_tree".

use strict;
use warnings;
use Carp;

# Convert to ExtJS tree.
# Node: Hash with attributes "text" and 
# - either "leaf: true"
# - or "children: [ .. ]"
# Toplevel: array of nodes
sub create_tree {
    my ( $tree_input, $icon_class ) = @_;
    $icon_class ||= {};   # prevent "use of uninitialized value ..."

    # Inline sub that creates format expected by ExtJS-TreePanel.
    my $node = sub {
        my ($text, $childs) = @_;
        my $result = {};
        if (my $css = $icon_class->{$text}) {
            $result->{iconCls} = $css;
        }
        else {
            $result->{text} = $text;
        }
        if ($childs) {
            $result->{children} = $childs;
        }
        else {
            $result ->{leaf} = JSON::true;
        }
        return $result;
    };
    # Inline sub that recursively calls "$node"-inline-sub
    # to create structure needed for TreePanel.
    my $convert;
    $convert = sub {
        my ($in) = @_;
        my $type = ref($in);
        if (not $type) {
            return $node->($in);
        }
        elsif ($type eq 'HASH') {
            my @result;
            for my $key (sort keys %$in) {
                my $val = $convert->($in->{$key});
                push @result, $node->($key, 
                                      ref($val) eq 'ARRAY' ? $val : [$val]);
            }
            return \@result;
        }
        elsif ($type eq 'ARRAY') {
            return [ map { $convert->($_) } @$in ];
        }
    };
    return $convert->( $tree_input );;
}

1;
