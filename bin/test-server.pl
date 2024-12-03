#!/usr/bin/env perl

# Start backend of policy-web on arbitrary port.
# Print port number to STDOUT.
# Exit server after reading EOF from STDIN.

use strict;
use warnings;
use Plack::Test::Server;
use FindBin qw($Bin);

my $netspoc_psgi = do "$Bin/netspoc.psgi" or die "Can't parse PSGI file: $@";
my $server = Plack::Test::Server->new($netspoc_psgi);
my $port   = $server->port();
print("$port\n");
while (<>) {
    if (eof()) {
        exit();
    }
}
