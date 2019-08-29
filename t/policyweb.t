
# to test specific test in a specific order (login will be first anyway)
# run 'perl t/policyweb.t'
# with possible arguments:
#   remotely    - testing with BrowserStack
#   ie          - Internet Explorer 11.0
#   login
#   services
#   networks
#   entitlement
#   diff

use strict;
use warnings;
use lib 't';
use Test::More;
use Selenium::Remote::Driver;
use Selenium::Remote::WDKeys;
use Selenium::Waiter qw/wait_until/;

use PolicyWeb::Frontend;
use PolicyWeb::Login;
use PolicyWeb::Service;
use PolicyWeb::OwnNetworks;
use PolicyWeb::Entitlement;
use PolicyWeb::Diff;

my %tests = (networks => \&PolicyWeb::OwnNetworks::test,
             services     => \&PolicyWeb::Service::test,
             entitlement  => \&PolicyWeb::Entitlement::test,
             diff         => \&PolicyWeb::Diff::test,
            );

my $driver;

if (!scalar @ARGV) {

    $driver = PolicyWeb::Frontend::getDriver();

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

    my $with_login = 0;
    my $with_browserstack = 0;
    my $with_ie = 0;

    for (my $i = 0 ; $i < @ARGV ; $i++) {
        if ($ARGV[$i] eq "login") {
            $with_login = 1;
            splice @ARGV, $i--, 1;
        } elsif ($ARGV[$i] eq "remotely") {
            $with_browserstack = 1;
            splice @ARGV, $i--, 1;
        } elsif ($ARGV[$i] eq "ie") {
            $with_ie = 1;
            splice @ARGV, $i--, 1;
        }
    }

    if ($with_browserstack) {
        # 0 - Chrome
        # 1 - Internet Explorer 11.0
        $driver = PolicyWeb::Frontend::getBrowserstackyDriver($with_ie, \@ARGV);
    } else {
        if ($with_ie) {
            die "local testing with internet explorer not supported.\n";
        }
        $driver = PolicyWeb::Frontend::getDriver();
    }

    plan tests => scalar @ARGV + $with_login;

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

# use quit for Selenium::Remote::Driver
# use shutdown_binary for Selenium::Chrome
if ($driver) { $driver->quit; }
# if ($driver) { $driver->shutdown_binary; }

exit 0;
