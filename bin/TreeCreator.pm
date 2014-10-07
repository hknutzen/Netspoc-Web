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
