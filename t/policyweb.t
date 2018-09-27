
use strict;
use warnings;
use lib 't';
use Test::More tests => 6;
use Selenium::Remote::WDKeys;
use Selenium::Chrome;
use Selenium::Waiter qw/wait_until/;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use PolicyWeb::Login;
use PolicyWeb::Service;
use PolicyWeb::OwnNetworks;
use PolicyWeb::Entitlement;

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver = PolicyWeb::FrontendTest->new(
    browser_name   => 'chrome',
    proxy          => { proxyType => 'direct', },
    default_finder => 'id',
    javascript     => 1,
    base_url       => "http://$SERVER:$port",

    #custom_args    => '--temp-profile',
                                         );

$driver->set_implicit_wait_timeout(200);

$driver->get("index.html");

subtest login => sub { $driver->PolicyWeb::Login::test(); };

subtest "choose owner" => sub {
    plan tests => 1;

    my $owner = 'x';

    $driver->PolicyWeb::FrontendTest::choose_owner($owner);

    pass("owner $owner selcected");
};

subtest service => sub { $driver->PolicyWeb::Service::test(); };

subtest "own networks" => sub { $driver->PolicyWeb::OwnNetworks::test(); };

subtest entitlement => sub { $driver->PolicyWeb::Entitlement::test(); };

subtest logout => sub {
    plan tests => 1;

    my $logout = $driver->find_element('btn_logout');

    $driver->PolicyWeb::FrontendTest::move_click($logout);

    ok(wait_until { $driver->get_current_url() =~ /\/index\.html/ },
        "logout successeful");
};

done_testing();

if ($driver) { $driver->shutdown_binary; }

exit 0;
