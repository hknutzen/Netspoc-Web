#!/usr/bin/env perl

# Compare users found in /home/netspocweb/users to list of admins and watchers
# found in json export data (/home/netspocweb/export/current) from netspoc.
# Delete those that are not found in export data.

use strict;
use warnings;
use FindBin;
use lib $FindBin::Bin;
use JSON;
use Load_Config;

my $config      = Load_Config::load();
my $users_dir   = $config->{user_dir};
my $export_dir  = $config->{netspoc_data};
my $current_dir = $export_dir . '/current';

my $policy = readlink( $current_dir ) || die "Can't read link $current_dir";

if ( opendir(my $dh, $users_dir) ) {
    
    my @users = grep { /^.*\@.*\.\w+$/ && -f "$users_dir/$_" } readdir($dh);
    
    my $netspoc_users_file = "$export_dir/$policy/email";
    my $data;
    open( my $fh, '<', $netspoc_users_file ) or warn("Can't open $netspoc_users_file: $!");
    {
        local $/ = undef;
        $data = from_json(  <$fh>, { relaxed  => 1 } );
    }
    close( $fh );
    
    if ( scalar keys %$data ) {
        my @unseen = map { $users_dir . '/' . $_ } grep { !$data->{$_} } @users;
        for my $file ( @unseen ) {
            if ( int(-M $file) > 7 ) {
                #print "Would unlink $file \n";
                unlink $file or warn "Could not unlink $file: $!";
            }
        }
    }
    else {
        print STDERR "No owner export data found!\n";
    }
}
else {
    print STDERR "Couldn't open dir $users_dir";
}
