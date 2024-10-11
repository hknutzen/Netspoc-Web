#!perl

use strict;
use warnings;
use JSON;
use Test::More;
use Test::Differences;
use Plack::Test;
use lib 't';

use PolicyWeb::Init qw/$app $port $SERVER $home_dir prepare_export prepare_runtime_base/;
use PolicyWeb::Backend
    qw/prepare_runtime test_run extract_names extract_records/;


############################################################
# Netspoc configuration
############################################################
my $netspoc = <<'END';
owner:o = { admins = user@domain; }
network:n1 = { ip = 10.1.1.0/24; owner = o; }
END

prepare_export($netspoc);
prepare_runtime_base();

my $email = 'user@domain';
my $pass = 'secret';

# Create user data in old format of CGI::Session.
system("bin/add_user_pass $home_dir/users $email $pass") == 0 or die $!;

my ($path, $params, $data, $out, $title);

############################################################
$title = 'Check user data before login';
$out = qr/^\$D =/;
$data = `cat $home_dir/users/$email`;
like($data, $out, $title);

############################################################
$title = 'Login as "user@domain", save cookie';
test_psgi($app, sub {
    my $cb  = shift;
    my $uri = "http://$SERVER:$port/backend/login?email=$email&pass=$pass&app=../app.html";
    my $req = HTTP::Request->new(GET => $uri);
    my $res = $cb->($req);
    $res->is_redirect or die("Login failed: ", $res->content);
    $PolicyWeb::Backend::cookie = $res->header('Set-Cookie');
    ok($PolicyWeb::Backend::cookie, $title);
});

############################################################
$title = 'Check user data after login';
$out = {hash=>"{SSHA256}xxx"};
$data = from_json(`cat $home_dir/users/$email`);
if (exists($data->{hash})) {
    $data->{hash} =~ s/\{SSHA256\}.*/{SSHA256}xxx/;
}
eq_or_diff($data, $out, $title);

############################################################
$title = 'Save user data in JSON format';
$path = 'set_diff_mail';
$params = { active_owner => 'o', send => 'true' };
$out = [];
test_run($title, $path, $params, $out, \&extract_records);

############################################################
$title = 'Check user data after update';
$out = {send_diff=>["o"],hash=>"{SSHA256}xxx"};
$data = from_json(`cat $home_dir/users/$email`);
if (exists($data->{hash})) {
    $data->{hash} =~ s/\{SSHA256\}.*/{SSHA256}xxx/;
}
eq_or_diff($data, $out, $title);

############################################################
$title = 'Logout';
$path = 'logout';
$params = {};
$out = [];
test_run($title, $path, $params, $out, \&extract_records);

############################################################
$title = 'Login again with user data as JSON';
test_psgi($app, sub {
    my $cb  = shift;
    my $uri = "http://$SERVER:$port/backend/login?email=$email&pass=$pass&app=../app.html";
    my $req = HTTP::Request->new(GET => $uri);
    my $res = $cb->($req);
    $res->is_redirect or die("Login failed: ", $res->content);
    $PolicyWeb::Backend::cookie = $res->header('Set-Cookie');
    ok($PolicyWeb::Backend::cookie, $title);
});

############################################################
done_testing;
