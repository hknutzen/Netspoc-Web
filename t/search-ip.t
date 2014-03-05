#!perl

use strict;
use Test::More;
use Test::Differences;
use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use Plack::Test;
use JSON;
use HTTP::Request::Common;

my $export_dir = tempdir( CLEANUP => 1 );
my $policy = 'p1';
sub prepare_export {
    my ($input) = @_;
    my ($in_fh, $filename) = tempfile(UNLINK => 1);
    print $in_fh $input;
    close $in_fh;

    my $cmd = "perl bin/export.pl -quiet $filename $export_dir/$policy";
    my ($stdout, $stderr);
    run3($cmd, \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "Export failed:\n$stderr\n";
    $stderr and die "Unexpected output during export:\n$stderr\n";
    system("echo '# p1 #' > $export_dir/$policy/POLICY") == 0 or die;
    system("cd $export_dir; ln -s $policy current") == 0 or die;
}

my $home_dir   = tempdir( CLEANUP => 1 );
my $conf_file  = "$home_dir/policyweb.conf";
my $conf_data = <<END;
{
 "netspoc_data"  : "$export_dir",
 "session_dir"   : "$home_dir/sessions",
 "diff_mail_template" : "",
 "error_page"         : "",
 "noreply_address"    : "",
 "sendmail_command"   : "",
 "show_passwd_template"    : "",
 "user_dir"           : "",
 "verify_fail_template" : "",
 "verify_mail_template" : "",
 "verify_ok_template"   : "",
}    
END

my $cookie;
my $app;
sub prepare_runtime {

    # Prepare config file for netspoc.psgi
    open(my $fh, '>', $conf_file) or die "Can't open $conf_file";
    print $fh $conf_data;
    close $fh;

    # netspoc.psgi searches config file in $HOME directory.
    $ENV{HOME} = $home_dir;
    $app = do 'bin/netspoc.psgi' or die "Couldn't parse PSGI file: $@";

    # Login as guest
    test_psgi $app, sub {
        my $cb  = shift;
        my $res = $cb->(GET '/login?email=guest&app=../app.html');
        $res->is_redirect or die "Login failed: ", $res->content;
        $cookie = $res->header('Set-Cookie') or 
            die "Missing cookie in response to login";
    };
}

sub test_run {
    my ($title, $path, $request, $owner, $out, $process_result) = @_;
    
    $request->{active_owner} = $owner;
    $request->{history} = 'p1';

    my $uri = "/$path?" . join '&', map { "$_=$request->{$_}" } keys %$request;
    test_psgi $app, sub {
        my $cb  = shift;
        my $res = $cb->(GET $uri, Cookie => $cookie);
        $res->is_success or die $res->content;
        my $data = from_json($res->content, { utf8  => 1 });
        eq_or_diff($process_result->($data), $out, $title);
    };
}

############################################################
# Extracts data from result of request.
############################################################
my $service_names = sub { 
    my ($result) = @_;
    my $records = $result->{records} or die 'Missing records in response';
    return [ map { $_->{name} } @$records ];
};

############################################################
# Shared Netspoc configuration
############################################################
my $netspoc = <<'END';
owner:x = { admins = guest; }
owner:y = { admins = guest; }
owner:z = { admins = guest; }

area:all = { owner = x; anchor = network:Big; }
any:Big  = { owner = y; link = network:Big; }
any:Sub1 = { ip = 10.1.0.0/23; link = network:Big; }
any:Sub2 = { ip = 10.1.1.0/25; link = network:Big; }

network:Sub = { ip = 10.1.1.0/24; owner = z; subnet_of = network:Big; }
router:u = { 
 interface:Sub;
 interface:L = { ip = 10.3.3.3; loopback; }
 interface:Big = { ip = 10.1.0.2; } 
}
network:Big = { 
 ip = 10.1.0.0/16;
 host:B10 = { ip = 10.1.0.10; owner = z; }
 host:Range = { range = 10.1.0.90-10.1.0.99; }
}

router:asa = {
 managed;
 model = ASA;
 routing = manual;
 interface:Big = { ip = 10.1.0.1; hardware = outside; }
 interface:Kunde = { ip = 10.2.2.1; hardware = inside; }
 interface:DMZ = { ip = 10.9.9.1; hardware = dmz; }
}

network:Kunde = { ip = 10.2.2.0/24; host:k = { ip = 10.2.2.2; } }
any:Kunde = { link = network:Kunde; }

network:DMZ = { ip = 10.9.9.0/24; }
any:DMZ10 = { ip = 10.0.0.0/8; link = network:DMZ; }

router:inet = {
 interface:DMZ;
 interface:Internet; 
}

network:Internet = { ip = 0.0.0.0/0; }

service:Test1 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
}

service:Test2 = {
 user = network:Big, any:Sub1;
 permit src = user; dst = host:k; prt = udp 80;
}

service:Test3 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 81;
}

service:Test4 = {
 user = host:B10, host:Range, interface:u.Big;
 permit src = user; dst = host:k; prt = tcp 81;
}

service:Test5 = {
 user = any:Big;
 permit src = user; dst = host:k; prt = tcp 82;
}

service:Test6 = {
 user = host:B10;
 permit src = user; dst = any:Kunde; prt = udp 82;
}

service:Test7 = {
 user = host:B10;
 permit src = user; dst = network:Internet; prt = udp 82;
}

service:Test8 = {
 user = host:B10;
 permit src = user; dst = any:DMZ10; prt = udp 82;
}

END
############################################################

prepare_export($netspoc);
prepare_runtime();

my ($path, $params, $owner, $out, $title);
$path = 'service_list';

############################################################
$title = 'Exact IP search in used services';
############################################################

$owner = 'z'; 
$params = {
    search_ip1   => '10.1.1.0/255.255.255.0',
    search_ip2   => '10.2.2.0/24',
    search_used  => 1,
};

$out = [ qw(Test1 Test3) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search in own services';
############################################################

$owner = 'x'; 
$params = {
    search_ip1   => '10.1.0.0/255.255.0.0',
    search_ip2   => '10.2.2.2/32',
    search_own   => 1,
};

$out = [ qw(Test2) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search for host';
############################################################

$params = {
    search_ip1   => '10.1.0.10/32',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search for range';
############################################################

$params = {
    search_ip1   => '10.1.0.93/32',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search for interface';
############################################################

$params = {
    search_ip1   => '10.1.0.2',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search for aggregate';
############################################################

$params = {
    search_ip1   => '10.1.0.0/23',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Exact IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/24',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test3) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Search for protocol';
############################################################

$params = {
    search_proto => 'TCP',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test3 Test4 Test5) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Search for proto and exact IP';
############################################################

$params = {
    search_ip1   => '10.2.2.0/24',
    search_proto => '81',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test3) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Subnet IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/25',
    search_subnet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2 Test4 Test5) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Supernet IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/25',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test3 Test6) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Supernet IP search for aggregate';
############################################################

$params = {
    search_ip1   => '10.1.0.0/16',
    search_ip2   => '10.2.2.2',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2 Test5) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Supernet IP search finds all aggregates';
############################################################

$params = {
    search_ip1   => '10.0.0.0/8',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test7 Test8) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Supernet IP search for loopback';
############################################################

$params = {
    search_ip1   => '10.3.3.3',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test5) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
$title = 'Supernet IP search for unknown internet address';
############################################################

$params = {
    search_ip1   => '9.9.9.9',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test7) ];

test_run($title, $path, $params, $owner, $out, $service_names);

############################################################
done_testing;
