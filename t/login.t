
use strict;
use warnings;

use lib 't';
use Test::More tests => 7;
use Selenium::Remote::Driver;

use Selenium::Remote::WDKeys;
use Test::Selenium::Remote::Driver;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use Selenium::Waiter qw/wait_until/;

=head
my $profile = Selenium::Firefox::Profile->new();
$profile->set_preference(
    "network.proxy.type" => 0
    );

my $driver = Selenium::Remote::Driver->new(
    firefox_profile => $profile,
    base_url        => $base_url,
    default_finder  => 'id'
    );
=cut

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $base_url = "http://$SERVER:$port";

my $driver =
  Test::Selenium::Remote::Driver->new(browser_name   => 'chrome',
                                      proxy          => { proxyType => 'direct', },
                                      base_url       => $base_url,
                                      default_finder => 'id',
                                      javascript     => 1,
                                     );

eval {

    $driver->get('index.html');

    $driver->set_window_size(640, 480);

    if (find_login()) {

        $driver->send_keys_to_active_element('not_guest');

        $driver->click_element_ok('btn_login', "login button");

        ok($driver->get_current_url() =~ /backend\/login/, "login as not_guest failed");

        $driver->get('index.html');

        $driver->send_keys_to_active_element('guest');

        $driver->find_element('btn_login')->click;

        ok($driver->get_current_url() =~ /app.html/, "login as guest successeful");

        my $logout = $driver->find_element('btn_logout');
        $driver->PolicyWeb::FrontendTest::move_click($logout);
        ok(wait_until { $driver->get_current_url() =~ /\/index\.html/ },
            "logout successeful");
    }
    done_testing();
};

if ($@) { print $@ , "\n"; }

$driver->quit;

exit 0;

# checks if elements needed to login are present.
# return 1, if true.
sub find_login {
    my $a = $driver->find_element_ok('txtf_email',    "found input box:\temail");
    my $b = $driver->find_element_ok('txtf_password', "found input box:\tpassword");
    my $c = $driver->find_element_ok('btn_login',     "found button:\tlogin");
    return $a && $b && $c;
}
