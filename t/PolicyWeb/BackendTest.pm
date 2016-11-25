
package PolicyWeb::BackendTest;

use strict;
use Test::More;
use Test::Differences;
use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use Plack::Test;
use JSON;
use HTTP::Request::Common;

require Exporter;
our @ISA = qw(Exporter);
our @EXPORT = qw(
 prepare_export
 prepare_runtime
 prepare_runtime_no_login
 test_run
 extract_records
 extract_names
 );



############################################################
# Shared Netspoc configuration
############################################################
my $netspoc = <<'END';
owner:x = { admins = guest; show_all; }
owner:y = { admins = guest; }
owner:z = { admins = guest; }

area:all = { owner = x; anchor = network:Big; }
any:Big  = { link = network:Big; }
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
 interface:Big    = { ip = 10.1.0.1; hardware = outside; }
 interface:Kunde  = { ip = 10.2.2.1; hardware = inside; }
 interface:KUNDE  = { ip = 10.2.3.1; hardware = inside; }
 interface:KUNDE1 = { ip = 10.2.4.1; hardware = inside; }
 interface:DMZ    = { ip = 10.9.9.1; hardware = dmz; }
}

network:Kunde  = { ip = 10.2.2.0/24; owner = y; host:k  = { ip = 10.2.2.2; } }
network:KUNDE  = { ip = 10.2.3.0/24; owner = y; host:K  = { ip = 10.2.3.3; } }
network:KUNDE1 = { ip = 10.2.4.0/24; owner = y; host:K1 = { ip = 10.2.4.4; } }
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
 description = My foo
 user = network:Big, any:Sub1;
 permit src = user; dst = host:k; prt = udp 80;
}

service:Test3 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 81;
}

service:Test3a = {
 multi_owner;
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
 permit src = user; dst = network:DMZ; prt = tcp 81;
}

service:Test4 = {
 description = Your foo
 multi_owner;
 user = host:B10, host:k, host:Range, interface:u.Big, network:DMZ;
 permit src = user; dst = host:k; prt = tcp 81;
 permit src = user; dst = host:B10; prt = tcp 82;
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

service:Test9 = {
 user = host:B10, host:k;
 permit src = user; dst = user; prt = udp 83;
 permit src = user; dst = network:DMZ; prt = udp 83;
}

service:Test10 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE; prt = tcp 84;
}

service:Test11 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE1; prt = tcp 84;
}

END
############################################################



#my $export_dir = tempdir( CLEANUP => 1 );
my $export_dir = tempdir( );
my $policy = 'p1';
sub prepare_export {
    my ($input) = @_;
    $input ||= $netspoc;
    my ($in_fh, $filename) = tempfile(UNLINK => 1);
    print $in_fh $input;
    close $in_fh;

    my $cmd = "export-netspoc -quiet $filename $export_dir/$policy";
    my ($stdout, $stderr);
    run3($cmd, \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "Export failed:\n$stderr\n";
    $stderr and die "Unexpected output during export:\n$stderr\n";
    system("echo '# $policy #' > $export_dir/$policy/POLICY") == 0 or die;
    system("cd $export_dir; ln -s $policy current") == 0 or die;
}

my $home_dir   = tempdir( CLEANUP => 1 );
my $conf_file  = "$home_dir/policyweb.conf";
my $conf_data = <<END;
{
 "netspoc_data"         : "$export_dir",
 "session_dir"          : "$home_dir/sessions",
 "diff_mail_template"   : "",
 "error_page"           : "",
 "noreply_address"      : "",
 "sendmail_command"     : "",
 "show_passwd_template" : "",
 "user_dir"             : "",
 "verify_fail_template" : "",
 "verify_mail_template" : "",
 "verify_ok_template"   : "",
 "expire_logged_in"     : "",
 "about_info_template"  : "",
 "business_units"       : "",
 "template_path"        : "",
}    
END

my $cookie;
my $app;

sub prepare_runtime_base {
    my $opts = shift;
    
    # Prepare config file for netspoc.psgi
    open(my $fh, '>', $conf_file) or die "Can't open $conf_file";
    print $fh $conf_data;
    close $fh;

    # netspoc.psgi searches config file in $HOME directory.
    $ENV{HOME} = $home_dir;
    $app = do 'bin/netspoc.psgi' or die "Couldn't parse PSGI file: $@";

    if ( $opts && $opts->{login} ) {
        # Login as guest
        test_psgi $app, sub {
            my $cb  = shift;
            my $res = $cb->(GET '/login?email=guest&app=../app.html');
            $res->is_redirect or die "Login failed: ", $res->content;
            $cookie = $res->header('Set-Cookie') or 
                die "Missing cookie in response to login";
        };
    }
}

sub prepare_runtime {
    prepare_runtime_base( { login => 1 } );
}

sub prepare_runtime_no_login {
    prepare_runtime_base( { login => 0 } );
}

sub test_run {
    my ($title, $path, $request, $owner, $out, $process_result) = @_;
    
    $request->{active_owner} = $owner;
    $request->{history} = $policy;

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
sub extract_records { 
    my ($result) = @_;
    my $records = $result->{records} or die 'Missing records in response';
    return $records;
};

sub extract_names { 
    my ($result) = @_;
    my $records = $result->{records} or die 'Missing records in response';
    return [ map { $_->{name} } @$records ];
};




1;



