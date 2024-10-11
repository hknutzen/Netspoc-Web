#!/usr/local/bin/perl

# Convert files in "users" directory to JSON
# from old format of CGI::Session.

use strict;
use warnings;
use FindBin;
use lib $FindBin::Bin;
use User_Store;

sub usage {
    die "Usage: $0 DIRECTORY\n";
}

my $dir = shift @ARGV or usage();
@ARGV and usage();

opendir(my $dh, $dir) or die "Can't opendir $dir: $!";
my $config = { user_dir => $dir };

for my $email (sort readdir($dh)) {
    $email =~ /[@]/ or next;
    next if $email =~ /~$/;
    # Read user data. Files is written immediately,
    # if old format of CGI::Session was detected.
    User_Store::new($config, $email);
}
