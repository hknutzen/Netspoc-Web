#!perl

use strict;
use warnings;
use Test::More;
use Test::Differences;
use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use Cwd 'abs_path';
use File::Find;
use Plack::Test;
use JSON;

my $export_dir = tempdir( CLEANUP => 1 );
my $home_dir   = tempdir( CLEANUP => 1 );
my $user_dir   = "$home_dir/users";
my $conf_file  = "$home_dir/policyweb.conf";
my $conf_data = <<END;
{
 "netspoc_data"  : "$export_dir",
 "user_dir"           : "$user_dir",
 "session_dir"        : "$home_dir/sessions",
 "diff_mail_template" : "",
 "error_page"         : "",
 "noreply_address"    : "",
 "sendmail_command"   : "",
 "show_passwd_template" : "",
 "verify_fail_template" : "",
 "verify_mail_template" : "",
 "verify_ok_template"   : "",
 "expire_logged_in"     : "",
 "about_info_template"  : "",
 "business_units"       : "",
 "template_path"        : "",
}    
END

sub prepare {

    # Prepare config file used by cleanup_daily.
    open(my $fh, '>', $conf_file) or die "Can't open $conf_file";
    print $fh $conf_data;
    close $fh;

    # Config file is searched in $HOME directory.
    $ENV{HOME} = $home_dir;

    # Called scripts are searched in ~/NetspocWeb/bin/
    my $bin_dir = abs_path('bin') or die "Can't find 'bin' directory: $!";
    mkdir "$home_dir/NetspocWeb" or die $!;
    symlink $bin_dir, "$home_dir/NetspocWeb/bin" or die $!;

    # Create users directory to calm down del_obsolete_users.pl
    mkdir $user_dir or die $!;
}

my $policy_num = 1;

# Use simulated time to set timestamp for version controlled files.
my $one_day = 60 * 60 * 24;
my $timestamp;

sub set_time_days_ago {
    my ($n) = @_;
    $timestamp = time() - $n * $one_day;
}

sub inc_time_by_days {
    my ($n) = @_;
    $timestamp += $n * $one_day;
}
    
sub set_timestamp_of_files {
    my ($path) = @_;
    find(sub { -f and utime($timestamp, $timestamp, $_) }, $path);
}

sub export_netspoc {
    my ($input) = @_;
    my $policy = "p$policy_num";
    $policy_num++;
    my ($in_fh, $filename) = tempfile(UNLINK => 1);
    print $in_fh $input;
    close $in_fh;

    my $policy_path = "$export_dir/$policy";
    my $cmd = "perl /home/knutzehe/Netspoc/bin/export-netspoc -quiet $filename $policy_path";
    my ($stdout, $stderr);
    run3($cmd, \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "Export failed:\n$stderr\n";
    $stderr and die "Unexpected output during export:\n$stderr\n";
    system("echo '# $policy #' > $policy_path/POLICY") == 0 or die $!;
    system("cd $export_dir; ln -sfT $policy current") == 0 or die $!;
    set_timestamp_of_files($policy_path);
}

sub cleanup_daily {
    my $cmd = "bin/cleanup_daily";
    my ($stdout, $stderr);
    run3($cmd, \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "cleanup_daily failed:\n$stderr\n";
    $stderr and die "Unexpected output during cleanup_daily:\n$stderr\n";
}

sub test_removed {
    my ($title, $path) = @_;
    ok(not(-e "$export_dir/$path"), "$title: removed $path");
}

sub test_rlog {
    my ($title, $path, $expected) = @_;
    my ($stdout, $stderr);
    run3("rlog $export_dir/$path", \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "rlog failed:\n$stderr\n";
    $stderr and die "Unexpected output during rlog:\n$stderr\n";

    # Ignore header.
    $stdout =~ s/^ .* \n init \n ----+ \n //xs;

    # Ignore all dates.
    $stdout =~ s/\n date: .*//xg;

    # Ignore trailing line.
    $stdout =~ s/ \n ====+ //x;
    
    eq_or_diff($stdout, $expected, "$title: rlog $path");
}


# Prepare one for all tests.
prepare();

my ($title);

############################################################
$title = 'Initial policy';
############################################################

my $netspoc = <<'END';
owner:x = { admins = guest; }
network:n1 = {
 ip = 10.1.1.0/24; owner = x;
#host:h1 = { ip = 10.1.1.10; }
}
END

# Older than 1 year; will be removed from RCS.
set_time_days_ago(400);
export_netspoc($netspoc);
cleanup_daily();
 
test_rlog($title, 'RCS/POLICY,v', <<END);
revision 1.1
p1
END
test_rlog($title, 'RCS/owner/x/POLICY,v', <<END);
revision 1.1
p1
END

############################################################
$title = 'p2 add another owner';
############################################################

$netspoc .= <<'END';
owner:y = { admins = guest; }
network:n2 = { ip = 10.1.2.0/24; owner = y; }

router:r1 = {
 model = IOS;
 managed;
 interface:n1 = { ip = 10.1.1.2; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
}
END

inc_time_by_days(1);
export_netspoc($netspoc);
cleanup_daily();
 
test_rlog($title, 'RCS/POLICY,v', <<END);
revision 1.2
p2
----------------------------
revision 1.1
p1
END
test_rlog($title, 'RCS/owner/x/POLICY,v', <<END);
revision 1.1
p1
END
test_rlog($title, 'RCS/owner/y/POLICY,v', <<END);
revision 1.1
p2
END
test_removed($title, 'p1');

############################################################
$title = 'p3 add service; outdate revisions';
############################################################

$netspoc .= <<'END';
service:s1 = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
END

inc_time_by_days(1);
export_netspoc($netspoc);
cleanup_daily();

test_rlog($title, 'RCS/POLICY,v', <<END);
revision 1.3
p3
END
test_rlog($title, 'RCS/services,v', <<END);
revision 1.2
p3
END
test_rlog($title, 'RCS/objects,v', <<END);
revision 1.2
p2
END
test_rlog($title, 'RCS/owner/x/POLICY,v', <<END);
revision 1.2
p3
END
test_rlog($title, 'RCS/owner/x/assets,v', <<END);
revision 1.2
p2
END
test_rlog($title, 'RCS/owner/y/POLICY,v', <<END);
revision 1.2
p3
END
test_rlog($title, 'RCS/owner/y/service_lists,v', <<END);
revision 1.2
p3
END
test_removed($title, 'p2');

############################################################
done_testing;
