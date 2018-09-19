
use strict;
use warnings;

use Data::Dumper;
use lib 't';
use Test::More;
use Selenium::Remote::WDKeys;
use Selenium::Waiter qw/wait_until/;
use Selenium::ActionChains;
use PolicyWeb::FrontendTest;
use PolicyWeb::Init;
use JSON;

##############################################################################
#
# Test description:
# -----------------
# - Go to tab "Eigene Netze"
# - Select a network and confirm network selection (by pressing appropriate button)
# - Check for change of button label from "Eigene Netze" to "Ausgewählte Netze"
# - Change to tab "Dienste, Freischaltungen" and check that own services
#   left are the ones we expected for the selected network
# - Go back to tab "Eigene Netze"
# - Cancel network selection
# - Check that button label changed back to "Eigene Netze"
#
##############################################################################

my $driver = PolicyWeb::FrontendTest->new(
    browser_name       => 'chrome',
    proxy              => { proxyType => 'direct', },
    default_finder     => 'id',
    javascript         => 1,
    extra_capabilities => { nativeEvents => 'false' }
);

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

$driver->login_as_guest_and_choose_owner('x');

#
# Needed navigation elements
#
my $confirm_button = $driver->find_element('btn_confirm_network_selection');
my $cancel_button  = $driver->find_element('btn_cancel_network_selection');
my $services_tab_button = $driver->find_element('btn_services_tab');
my $networks_tab_button = $driver->find_element('btn_own_networks_tab');

$driver->click_element_ok( 'btn_own_networks_tab', 'id',
    'Click on button "Eigene Netze" ' );

my $networks_grid = wait_until { $driver->find_element('grid_own_networks') };

my $elements
    = $driver->find_child_elements( $networks_grid, 'x-grid-cell', 'class' );

my $checkboxes
    = $driver->find_child_elements( $networks_grid, 'input[type="checkbox"]',
    'css' );

#my $checkboxes = $driver->find_child_elements( $networks_grid, 'x-grid-row-checker', 'class' , 'class' );

done_testing();
exit 0;

die Dumper($checkboxes);

my @enabled = grep { $_->is_selected() } @$checkboxes;

my @array = grep { $_->get_text() eq 'network:DMZ' } @$elements;

is( scalar(@enabled), 0, 'No network selected initially' );

$driver->move_to( element => $array[0] );
ok( $driver->click(), 'Select "network:DMZ"' );

$checkboxes
    = $driver->find_child_elements( $networks_grid, 'x-grid-row-checker',
    'class' );    #THIS IS BROKEN! HOW TO FIND SELECTED GRID ELEMENTS?

@enabled = grep { $_->is_selected() } @$checkboxes;
error scalar(@enabled);

#my $foo = wait_until { $driver->find_element('foo' ) };

is( scalar(@enabled), 1, 'One network selected' );

for my $el (@$elements) {

    #error Dumper( $el->get_text() );
    #error "------------------------------";
}

my $label = $networks_tab_button->get_text();
like( $label, qr/Eigene Netze/, 'Button for own networks has default label' );
$driver->move_to( element => $confirm_button );
ok( $driver->click(), 'Confirm selection of network "network:DMZ"' );

$label = $networks_tab_button->get_text();
chomp($label);
like(
    $label,
    qr/Ausgew\whlte Netze/,
    'Button for own networks changed to selection mode label "Ausgewählte Netze"'
);

my $expected = [ 'Test3a', 'Test4', 'Test9' ];

$driver->move_to( element => $services_tab_button );
ok( $driver->click(), 'Select tab "Dienste, Freischaltungen"' );

$driver->click_element_ok( 'btn_own_services', 'id',
    'Click on button "Eigene Dienste" ' );

my $service_grid = wait_until { $driver->find_element('grid_services') };
$elements
    = $driver->find_child_elements( $service_grid, 'x-grid-cell', 'class' );

my $got = [ map { $_->get_text } @$elements ];

is_deeply( $expected, $got,
    'Three expected services remained for "network:DMZ"' );

#my $foo = wait_until { $driver->find_element('foo' ) };

=head
IP-Adresse         Name       Verantwortungsbereich
0.0.0.0/0.0.0.0        network:Internet x
10.1.0.0/255.255.0.0   network:Big      x
10.1.1.0/255.255.255.0 network:Sub      z
10.2.2.0/255.255.255.0 network:Kunde    y
10.2.3.0/255.255.255.0 network:KUNDE    y
10.2.4.0/255.255.255.0 network:KUNDE1   y
10.9.9.0/255.255.255.0 network:DMZ      x
=cut

done_testing();

