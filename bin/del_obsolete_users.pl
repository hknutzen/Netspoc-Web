#!/usr/bin/env perl

# Compare users found in /home/netspocweb/users to list of admins and watchers
# found in json export data (/home/netspocweb/export/current) from netspoc.
# Delete those that are not found in export data.

use strict;
use warnings;
use FindBin;
use lib $FindBin::Bin;
use Load_Config;
use JSON_Cache;

my $config     = Load_Config::load();
my $users_dir  = $config->{user_dir};
my $export_dir = $config->{netspoc_data};

my $cache = JSON_Cache->new(netspoc_data => $export_dir, max_versions => 1);
my $email2owners = $cache->load_json_current('email')
    or exit;

opendir(my $dh, $users_dir)
    or exit;
for my $email (readdir($dh)) {
    $email =~ /[@]/ or next;

    # Check if email or wildcard is allowed to see some owners.
    my $wildcard = $email =~ s/^.*@/[all]@/r;
    if ($email2owners->{$wildcard} or $email2owners->{$email}) {
        next;
    }

    # Remove file for email,
    # - that can't see any owner and
    # - is at least 7 days old.
    my $file = "$users_dir/$email";
    if ( int(-M $file) > 7 ) {
        #print "Would unlink $file \n";
        unlink $file or warn "Could not unlink $file: $!";
    }
}
closedir($dh);
