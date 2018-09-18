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

use Load_Config;
use User_Store;

my $export_dir = tempdir( CLEANUP => 1 );
my $home_dir   = tempdir( CLEANUP => 1 );
my $user_dir   = "$home_dir/users";
my $conf_file  = "$home_dir/policyweb.conf";
my $conf_data = <<"END";
{
 "netspoc_data"  : "$export_dir",
 "user_dir"           : "$user_dir",
 "session_dir"        : "$home_dir/sessions",
 "noreply_address"    : "noreply",
 "sendmail_command"   : "$home_dir/sendmail",
 "business_units"       : "",
}
END

# Dummy sendmail, showing mail on STDOUT.
my $sendmail_dummy = <<"END";
#!/bin/sh
cat
END

my $config;

sub write_file {
    my ($path, $content) = @_;
    open(my $fh, '>', $path) or die "Can't open $path";
    print $fh $content;
    close $fh;
}

sub make_visible {
    my ($path) = @_;
    my $abs = abs_path($path) or die "Can't find '$path' directory: $!";
    -d "$home_dir/NetspocWeb" or mkdir "$home_dir/NetspocWeb" or die $!;
    symlink $abs, "$home_dir/NetspocWeb/$path" or die $!;
}

sub prepare {

    # Prepare config file used by cleanup_daily.
    write_file($conf_file, $conf_data);

    # Config file is searched in $HOME directory.
    $ENV{HOME} = $home_dir;

    # Called scripts are searched in ~/NetspocWeb/bin/
    make_visible('bin');

    # Templates in subdirectory 'mail' are used in send_diff.pl
    make_visible('mail');

    # Create users directory
    # - to calm down del_obsolete_users.pl and
    # - to store attribute 'send_diff'
    mkdir $user_dir or die $!;

    # Create dummy sendmail command.
    write_file("$home_dir/sendmail", $sendmail_dummy);
    chmod(0755, "$home_dir/sendmail");

}

sub set_send_diff {
    my ($email, $owner_list) = @_;
    my $store = User_Store::new($config, $email);
    $store->param('send_diff', $owner_list);
    $store->flush();
}

my $policy_num = 1;

# Use simulated time to set timestamp for version controlled files.
my $one_day = 60 * 60 * 24;
my $timestamp;

sub set_old_time {
    $timestamp = 0;
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
    my $cmd = "perl /home/$ENV{USER}/Netspoc/bin/export-netspoc -quiet $filename $policy_path";
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
    $stderr and
        die "Unexpected output on STDERR during cleanup_daily:\n$stderr\n";
    return $stdout;
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
$config = Load_Config::load();

my ($title, $netspoc, $mail);

############################################################
$title = 'Initial policy';
############################################################

$netspoc = <<'END';
owner:x = { admins = x@example.com, y@example.com; }
network:n1 = {
 ip = 10.1.1.0/24; owner = x;
}
END

# Set time to 1970, older than 1 year; will be removed from RCS.
set_old_time();
export_netspoc($netspoc);
$mail = cleanup_daily();

test_rlog($title, 'RCS/POLICY,v', <<"END");
revision 1.1
p1
END
test_rlog($title, 'RCS/owner/x/POLICY,v', <<"END");
revision 1.1
p1
END
eq_or_diff($mail, '', "$title: mail");

############################################################
$title = 'p2 add another owner';
############################################################

$netspoc .= <<'END';
owner:y = { admins = y@example.com; }
network:n2 = { ip = 10.1.2.0/24; owner = y; }

router:r1 = {
 model = IOS;
 managed;
 interface:n1 = { ip = 10.1.1.2; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
}
END

inc_time_by_days(1);
set_send_diff('x@example.com', ['x', 'y']);
set_send_diff('y@example.com', ['x', 'y']);
export_netspoc($netspoc);
$mail = cleanup_daily();

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
eq_or_diff($mail, <<'END', "$title: mail");
To: x@example.com
Subject: Policy-Web: Diff für y wird nicht mehr versandt
Content-Type: text/plain; charset=UTF-8

Keine Berechtigung für Zugriff auf Owner 'y'.
END

############################################################
$title = 'p3 add service, outdate revisions';
############################################################

$netspoc .= <<'END';
service:s1 = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
END

inc_time_by_days(1);
export_netspoc($netspoc);
$mail = cleanup_daily();

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
eq_or_diff($mail, <<"END", "$title: mail");
To: x\@example.com
Subject: Policy-Web: Diff für x, 1970-01-03
Content-Type: text/plain; charset=UTF-8

(+): etwas wurde hinzugefügt
(-): etwas wurde entfernt
(!): etwas wurde geändert
 ➔ : trennt alten von neuem Wert

Unterschiede für den Verantwortungsbereich x
zwischen 1970-01-02 und 1970-01-03.

Liste genutzter Dienste
 (+)
  s1
To: y\@example.com
Subject: Policy-Web: Diff für x, 1970-01-03
Content-Type: text/plain; charset=UTF-8

(+): etwas wurde hinzugefügt
(-): etwas wurde entfernt
(!): etwas wurde geändert
 ➔ : trennt alten von neuem Wert

Unterschiede für den Verantwortungsbereich x
zwischen 1970-01-02 und 1970-01-03.

Liste genutzter Dienste
 (+)
  s1
To: y\@example.com
Subject: Policy-Web: Diff für y, 1970-01-03
Content-Type: text/plain; charset=UTF-8

(+): etwas wurde hinzugefügt
(-): etwas wurde entfernt
(!): etwas wurde geändert
 ➔ : trennt alten von neuem Wert

Unterschiede für den Verantwortungsbereich y
zwischen 1970-01-02 und 1970-01-03.

Liste eigener Dienste
 (+)
  s1
END

############################################################
$title = 'p4 remove owner';
############################################################

$netspoc =~ s/^owner:y =/#/m;
$netspoc =~ s/owner = y;//;
inc_time_by_days(1);
set_send_diff('x@example.com', ['x', 'y']);
set_send_diff('y@example.com', ['x', 'y']);
export_netspoc($netspoc);
$mail = cleanup_daily();
eq_or_diff($mail, <<"END", "$title: mail");
To: x\@example.com
Subject: Policy-Web: Diff für y wird nicht mehr versandt
Content-Type: text/plain; charset=UTF-8

Owner 'y' existiert nicht mehr.
To: y\@example.com
Subject: Policy-Web: Diff für y wird nicht mehr versandt
Content-Type: text/plain; charset=UTF-8

Owner 'y' existiert nicht mehr.
To: x\@example.com
Subject: Policy-Web: Diff für x, 1970-01-04
Content-Type: text/plain; charset=UTF-8

(+): etwas wurde hinzugefügt
(-): etwas wurde entfernt
(!): etwas wurde geändert
 ➔ : trennt alten von neuem Wert

Unterschiede für den Verantwortungsbereich x
zwischen 1970-01-03 und 1970-01-04.

Objekte
 network:n2
  owner
  y ➔ ''
Dienste
 s1
  details
   owner
    (+)
     :unknown
    (-)
     y
  rules
   1
    dst
     (!)
      network:n2
Liste genutzter Dienste
 (!)
  s1
To: y\@example.com
Subject: Policy-Web: Diff für x, 1970-01-04
Content-Type: text/plain; charset=UTF-8

(+): etwas wurde hinzugefügt
(-): etwas wurde entfernt
(!): etwas wurde geändert
 ➔ : trennt alten von neuem Wert

Unterschiede für den Verantwortungsbereich x
zwischen 1970-01-03 und 1970-01-04.

Objekte
 network:n2
  owner
  y ➔ ''
Dienste
 s1
  details
   owner
    (+)
     :unknown
    (-)
     y
  rules
   1
    dst
     (!)
      network:n2
Liste genutzter Dienste
 (!)
  s1
END

############################################################
done_testing;
