#!/usr/local/bin/perl

# Compare users found in /home/netspocweb/users to list of admins and watchers
# found in json export data (/home/netspocweb/export/current) from netspoc.
# Delete those that are not found in export data.

use strict;
use warnings;
use FindBin;
use lib $FindBin::Bin;
use JSON_Cache;

my $users_dir  = '/home/netspocweb/users';
my $current_dir = '/home/netspocweb/export/current';
my $export_dir = '/home/netspocweb/export';
my $policy_path = $current_dir . '/' . 'POLICY';
my $cache  = JSON_Cache->new(
    netspoc_data => $export_dir,
    max_versions => 8
    );

my $policy = qx(cat $policy_path);
$policy =~ m/^# (\S+)/ or die "Can't find policy name in $policy_path";
$policy = $1;

opendir(my $dh, $users_dir) || die $!;

my @users = grep { /^.*\@.*\.\w+$/ && -f "$users_dir/$_" } readdir($dh);

my $data = load_json( 'email' );

if ( scalar keys %$data ) {
        my @unseen = map { $users_dir . '/' . $_ } grep { !$data->{$_} } @users;
        for my $file ( @unseen ) {
                if ( int(-M $file) > 7 ) {
                        unlink $file or warn "Could not unlink $file: $!";
                }
        }
}
else {
        print STDERR "No owner export data found!\n";
}

sub load_json {
    my ($key) = @_;
    return $cache->load_json_version($policy, $key);
}


