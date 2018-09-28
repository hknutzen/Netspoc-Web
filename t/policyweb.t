
use strict;
use warnings;
use lib 't';
use Test::More;    # tests => 6;
use Selenium::Remote::WDKeys;
use Selenium::Chrome;
use Selenium::Waiter qw/wait_until/;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use PolicyWeb::Login;
use PolicyWeb::Service;
use PolicyWeb::OwnNetworks;
use PolicyWeb::Entitlement;

#use PolicyWeb::StartDriver;

my $driver = PolicyWeb::FrontendTest::getDriver();

my %tests = (own_networks => \&PolicyWeb::OwnNetworks::test,
             services      => \&PolicyWeb::Service::test,
             entitlement  => \&PolicyWeb::Entitlement::test,
            );

my $complete = !(scalar @ARGV);

if ($complete) {
    subtest login => sub { PolicyWeb::Login::test($driver); };

    subtest "choose owner" => sub {
        plan tests => 1;

        my $owner = 'x';

        $driver->PolicyWeb::FrontendTest::choose_owner($owner);

        pass("owner $owner selcected");
    };

    for my $key (keys %tests) {
        subtest $key => sub { $tests{$key}->($driver); };
    }
    subtest logout => sub {
        plan tests => 1;

        my $logout = $driver->find_element('btn_logout');

        $driver->PolicyWeb::FrontendTest::move_click($logout);

        ok(wait_until { $driver->get_current_url() =~ /\/index\.html/ },
            "logout successeful");
    };

}
else {
    $driver->login_as_guest_and_choose_owner('x');
    for my $key (@ARGV) {
        subtest $key => sub { $tests{$key}->($driver); };
    }
}

done_testing();

if ($driver) { $driver->shutdown_binary; }

exit 0;
