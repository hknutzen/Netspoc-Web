#!/usr/bin/env perl

# Start backend of policy-web on arbitrary port.
# Print port number to STDOUT.
# Exit server after reading EOF from STDIN.

use strict;
use warnings;
use Plack::App::File;
use Plack::Builder;
use Plack::Test::Server;
use FindBin qw($Bin);

my $netspoc_psgi = do "$Bin/netspoc.psgi" or die "Can't parse PSGI file: $@";
my $Dir = "$Bin/..";
my $app = builder {
    mount "/extjs4" =>
        Plack::App::File->new(root => "$Dir/htdocs/extjs4")->to_app;
    mount "/silk-icons" =>
        Plack::App::File->new(root => "$Dir/htdocs/silk-icons")->to_app;
    mount "/" => Plack::App::File->new(root => "$Dir")->to_app;
    mount "/backend" => $netspoc_psgi;
};

my $server = Plack::Test::Server->new($app);
my $port   = $server->port();
print("$port\n");
while(<>) {
    if(eof()) {
        exit()
    }
}
