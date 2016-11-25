
use strict;
use warnings;

use Test::More;
use Selenium::Remote::Driver;
use Selenium::Firefox::Profile;
use Selenium::Remote::WDKeys;
use Selenium::Waiter;
use Test::Selenium::Remote::Driver;

my $SERVER   = "10.3.28.111";
my $base_url = "http://$SERVER/daniel4/";

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

#$driver->debug_on();

my $driver = Test::Selenium::Remote::Driver->new(
    browser_name   => 'chrome',
    proxy => {
        proxyType => 'direct',
    },
    base_url       => $base_url,
    default_finder => 'id',
    javascript     => 1,
    );


$driver->get( $base_url );

    
$driver->find_element_ok( '//input[@id="email"]', "xpath",
                     "Eingabefeld für Email vorhanden" );
$driver->find_element_ok( "pass", "Eingabefeld für Passwort vorhanden" );

$driver->send_keys_to_active_element('guest');

my $login_button = $driver->find_element( '//input[@value="Login"]', "xpath" );

$driver->click_element_ok('//input[@value="Login"]', "xpath",
                          "Login-Knopf gedrückt" );


my $button = wait_until { $driver->find_element_by_id('btn_print_rules') };

done_testing();
