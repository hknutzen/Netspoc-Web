
use strict;
use warnings;

use lib 't';
use Test::More;
use Selenium::Remote::Driver;
use Selenium::Firefox::Profile;
use Selenium::Remote::WDKeys;
use Selenium::Waiter;
use Test::Selenium::Remote::Driver;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use Data::Dumper;

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

my $driver = Test::Selenium::Remote::Driver->new(
    browser_name   => 'chrome',
    proxy          => { proxyType => 'direct', },
    base_url       => $base_url,
    default_finder => 'id',
    javascript     => 1,
);

#$driver->debug_on();

$driver->get('index.html');

$driver->find_element_ok( '//input[@name="email"]', "xpath",
    "Eingabefeld für Email vorhanden" );
$driver->find_element_ok( '//input[@name="pass"]', "xpath",
    "Eingabefeld für Passwort vorhanden" );

$driver->send_keys_to_active_element('guest');

my $login_button
    = $driver->find_element( '//input[@value="Login"]', "xpath" );

$driver->click_element_ok( '//input[@value="Login"]', "xpath",
    "Login-Knopf gedrückt" );

my $button = wait_until { $driver->find_element_by_id('btn_print_rules') };

done_testing();
