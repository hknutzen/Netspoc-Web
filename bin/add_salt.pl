#!/usr/local/bin/perl

# Rehash already hashed passwords and add salt
# to all files in "users" directory.

use strict;
use warnings;
use CGI::Session;
use CGI::Session::Driver::file;
use Digest::SHA qw/sha256_hex/;
use Crypt::SaltedHash;

sub usage {
    die "Usage: $0 DIRECTORY\n";
}

my $dir = shift @ARGV or usage();
@ARGV and usage();

opendir(my $dh, $dir) or die "Can't opendir $dir: $!";
while (my $file = readdir $dh) {
    next if $file eq '.' or $file eq '..';
    next if $file =~ /~$/;
    $CGI::Session::Driver::file::FileName = "%s";
    my $store = CGI::Session->load ('driver:file;id:static', 
                                   $file, 
                                   { Directory => $dir });
    my $pass = $store->param('pass') or next;
    my $csh = Crypt::SaltedHash->new(algorithm => 'SHA-256');
    $csh->add($pass);
    my $hash = $csh->generate;
    $store->param('old_hash', $hash);
    $store->clear('pass');
    $store->flush();
    print STDERR "Fixed $file\n";
#    my $c2 = Crypt::SaltedHash->new(algorithm => 'SHA-256');
#    $c2->validate($hash, $pass) or print STDERR "Can't validate $file\n";
#    print STDERR "Hash: $hash\nPass: $pass\n";
}
