#!perl

use strict;
use warnings;
use Test::More;
use Test::Differences;
use lib 'bin';
use lib 't';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use Cwd 'abs_path';
use File::Find;
use Plack::Test;
use MIME::Base64;
use Load_Config;
use User_Store;
use PolicyWeb::CleanupDaily;

my $export_dir = tempdir(CLEANUP => 1);
my $home_dir   = tempdir(CLEANUP => 1);
my $user_dir   = "$home_dir/users";
my $conf_file  = "$home_dir/policyweb.conf";
my $conf_data  = <<"END";
{
 "netspoc_data"  : "$export_dir",
 "user_dir"           : "$user_dir",
 "session_dir"        : "$home_dir/sessions",
 "noreply_address"    : "noreply",
 "sendmail_command"   : "$home_dir/sendmail",
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

sub prepare {

    # Prepare config file used by cleanup_daily.
    write_file($conf_file, $conf_data);

    # Add export-netspoc to PATH
    $ENV{PATH} = "$ENV{HOME}/Netspoc/bin/:$ENV{PATH}";

    # Config file is searched in $HOME directory.
    $ENV{HOME} = $home_dir;

    # Called scripts are searched in ~/Netspoc-Web/bin/
    make_visible($home_dir, 'bin');

    # Templates in subdirectory 'mail' are used in send_diff.pl
    make_visible($home_dir, 'mail');

    # Create users directory
    # - to calm down del_obsolete_users.pl and
    # - to store attribute 'send_diff'
    mkdir $user_dir or die $!;

    # Create dummy sendmail command.
    write_file("$home_dir/sendmail", $sendmail_dummy);
    chmod(0755, "$home_dir/sendmail");

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

sub test_removed {
    my ($title, $path) = @_;
    ok(not(-e "$export_dir/$path"), "$title: removed $path");
}

sub set_send_diff {
    my ($email, $owner_list) = @_;
    my $store = User_Store::new($config, $email);
    $store->param('send_diff', $owner_list);
    $store->flush();
    set_timestamp_of_files($user_dir, $timestamp);
}

sub test_user_ok {
    my ($title, $email) = @_;
    ok(-e "$user_dir/$email", "$title: has store $email");
}
sub test_user_removed {
    my ($title, $email) = @_;
    ok(not(-e "$user_dir/$email"), "$title: removed store $email");
}

sub test_mail {
    my ($title, $mail, $expected) = @_;

    # Mail header have non deterministic order.
    $mail =~ s/^(Subject: .*\r\n(?: .*?\r\n)?)(To: .*\r\n)/$2$1/gm;

    my $filtered = '';
  LINE:
    for my $line (split /^/, $mail) {
        for my $header
            (qw(Date MIME-Version Content-Type Content-Transfer-Encoding))
        {
            next LINE if $line =~ /^$header: /;
        }
        $line =~ s/=[?]UTF-8[?]B[?](.*?)[?]=/"UTF-8:" . decode_base64($1)/e;
        $line =~ s/\r\n/\n/;
        $filtered .= $line;
    }
    eq_or_diff($filtered, $expected, "$title: mail");
}

sub test_history {
    my ($title, $path, $expected) = @_;
    my ($stdout, $stderr);
    run3("cd $export_dir/history; ls -1d */$path", \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "ls failed:\n$stderr\n";
    $stderr and die "Unexpected output during ls:\n$stderr\n";

    # Only show found YYYY-MM-DD directories.
    $stdout =~ s/^(\d\d\d\d-\d\d-\d\d).*/$1/gm;

    eq_or_diff($stdout, $expected, "$title: $path");
}

# Prepare one for all tests.
prepare();
$config = Load_Config::load();

my ($title, $netspoc, $mail);

############################################################
$title = 'Initial policy';
############################################################

$netspoc = <<'END';
owner:x = { admins = x@example.com; }
network:n1 = {
 ip = 10.1.1.0/24; owner = x;
}
END

# Set time to 1970, older than 1 year; will be removed from history.
set_old_time();
export_netspoc($netspoc, $export_dir, $policy_num++, $timestamp);

$mail = cleanup_daily();

test_history($title, 'POLICY', <<"END");
1970-01-01
END
test_history($title, 'owner/x', <<"END");
1970-01-01
END
test_mail($title, $mail, '');

############################################################
$title = 'p2 add another owner';
############################################################

$netspoc .= <<'END';
owner:y = { admins = y@example.com; watchers = [all]@example.com; }
network:n2 = { ip = 10.1.2.0/24; owner = y; }

router:r1 = {
 model = IOS;
 managed;
 interface:n1 = { ip = 10.1.1.2; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
}
END

inc_time_by_days(1);
set_send_diff('x@example.com', [ 'x', 'y' ]);
set_send_diff('y@example.com', [ 'x', 'y' ]);
export_netspoc($netspoc, $export_dir, $policy_num++, $timestamp);
$mail = cleanup_daily();

test_history($title, 'POLICY', <<END);
1970-01-02
END
test_history($title, 'owner/x', <<END);
1970-01-02
END
test_history($title, 'owner/y', <<END);
1970-01-02
END
test_removed($title, 'p1');
test_mail($title, $mail, <<'END');
To: y@example.com
Subject: UTF-8:Policy-Web: Diff für x wird nicht mehr
 UTF-8: versandt

Keine Berechtigung f=C3=BCr Zugriff auf Owner 'x'.
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
export_netspoc($netspoc, $export_dir, $policy_num++, $timestamp);
$mail = cleanup_daily();

test_history($title, 'POLICY', <<END);
1970-01-03
END
test_history($title, 'services', <<END);
1970-01-03
END
test_history($title, 'objects', <<END);
1970-01-03
END
test_history($title, 'owner/x', <<END);
1970-01-03
END
test_history($title, 'owner/y', <<END);
1970-01-03
END
test_removed($title, 'p2');
test_mail($title, $mail, <<'END');
To: x@example.com
Subject: UTF-8:Policy-Web: Diff für x, 1970-01-03

(+): etwas wurde hinzugef=C3=BCgt
(-): etwas wurde entfernt
(!): etwas wurde ge=C3=A4ndert
 =E2=9E=94 : trennt alten von neuem Wert

Unterschiede f=C3=BCr den Verantwortungsbereich x
zwischen 1970-01-02 und 1970-01-03.

Liste genutzter Dienste
 (+)
  s1
To: x@example.com
Subject: UTF-8:Policy-Web: Diff für y, 1970-01-03

(+): etwas wurde hinzugef=C3=BCgt
(-): etwas wurde entfernt
(!): etwas wurde ge=C3=A4ndert
 =E2=9E=94 : trennt alten von neuem Wert

Unterschiede f=C3=BCr den Verantwortungsbereich y
zwischen 1970-01-02 und 1970-01-03.

Liste eigener Dienste
 (+)
  s1
To: y@example.com
Subject: UTF-8:Policy-Web: Diff für y, 1970-01-03

(+): etwas wurde hinzugef=C3=BCgt
(-): etwas wurde entfernt
(!): etwas wurde ge=C3=A4ndert
 =E2=9E=94 : trennt alten von neuem Wert

Unterschiede f=C3=BCr den Verantwortungsbereich y
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
set_send_diff('x@example.com', [ 'x', 'y' ]);
set_send_diff('y@example.com', [ 'x', 'y' ]);
set_send_diff('z@example.com', []);
export_netspoc($netspoc, $export_dir, $policy_num++, $timestamp);
$mail = cleanup_daily();
test_user_ok($title, 'x@example.com');
test_user_ok($title, 'y@example.com');
test_user_removed($title, 'z@example.com');
test_mail($title, $mail, <<"END");
To: x\@example.com
Subject: UTF-8:Policy-Web: Diff für y wird nicht mehr
 UTF-8: versandt

Owner 'y' existiert nicht mehr.
To: y\@example.com
Subject: UTF-8:Policy-Web: Diff für x wird nicht mehr
 UTF-8: versandt

Keine Berechtigung f=C3=BCr Zugriff auf Owner 'x'.
To: y\@example.com
Subject: UTF-8:Policy-Web: Diff für y wird nicht mehr
 UTF-8: versandt

Owner 'y' existiert nicht mehr.
To: x\@example.com
Subject: UTF-8:Policy-Web: Diff für x, 1970-01-04

(+): etwas wurde hinzugef=C3=BCgt
(-): etwas wurde entfernt
(!): etwas wurde ge=C3=A4ndert
 =E2=9E=94 : trennt alten von neuem Wert

Unterschiede f=C3=BCr den Verantwortungsbereich x
zwischen 1970-01-03 und 1970-01-04.

Objekte
 network:n2
  owner
  (-)
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
