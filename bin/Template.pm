package Template;

use strict;
use warnings;
use Carp;

# Input from template files is encoded in utf8.
# Output is explicitly sent as utf8.
use open IN => ':utf8';

sub read_file {
    my ($file) = @_;
    open(my $fh, '<', $file) or croak "Can't open $file: $!";
    local $/ = undef;
    my $text = <$fh>;
    close $fh;
    $text;
}

# Do simple variable substitution.
# Use syntax of template toolkit.
sub process {
    my ($text, $vars) = @_;
    while (my ($key, $value) = each %$vars) {
	$text =~ s/\[% $key %\]/$value/g;
    }
    $text;
}

sub get {
    my ($file, $vars ) = @_;
    my $text = read_file($file);
    $text = process($text, $vars);
    $text;
}					 

1;
