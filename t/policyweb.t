
# to test specific test in a specific order (login will be first anyway)
# run 'perl t/policyweb.t'
# with possible arguments:
#   login
#   services
#   own_networks
#   entitlement

use strict;
use warnings;
use lib 't';
use Test::More;
use Selenium::Remote::WDKeys;
use Selenium::Chrome;
use Selenium::Waiter qw/wait_until/;

use PolicyWeb::Frontend;
use PolicyWeb::Login;
use PolicyWeb::Service;
use PolicyWeb::OwnNetworks;
use PolicyWeb::Entitlement;
use PolicyWeb::Diff;

my $driver = PolicyWeb::Frontend::getDriver();

my %tests = (own_networks => \&PolicyWeb::OwnNetworks::test,
             services     => \&PolicyWeb::Service::test,
             entitlement  => \&PolicyWeb::Entitlement::test,
             diff         => \&PolicyWeb::Diff::test,
            );

if (!scalar @ARGV) {

    plan tests => 6;

    subtest login => sub { PolicyWeb::Login::test($driver); };

    for my $key (keys %tests) {
        subtest $key => sub { $tests{$key}->($driver); };
    }

    subtest logout => sub {
        plan tests => 1;

        my $logout = $driver->find_element('btn_logout');

        $driver->move_click($logout);

        ok(wait_until { $driver->get_current_url() =~ /\/index\.html/ },
            "logout successeful");
    };

}
else {

    plan tests => scalar @ARGV;

    my $with_login = 0;

    for (my $i = 0 ; $i < @ARGV ; $i++) {
        if ($ARGV[$i] eq "login") {
            $with_login = 1;
            splice @ARGV, $i, 1;
            last;
        }
    }

    if ($with_login) {
        subtest login => sub { PolicyWeb::Login::test($driver); };
    }
    else {
        $driver->login_as_guest();
    }

    for my $key (@ARGV) {
        subtest $key => sub { $tests{$key}->($driver); };
    }
}

done_testing();

if ($driver) { $driver->shutdown_binary; }

exit 0;
