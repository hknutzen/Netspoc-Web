
use strict;
use warnings;

use Data::Dumper;
use lib 't';
use Test::More;
use Selenium::Remote::WDKeys;
use Selenium::Waiter qw/wait_until/;
use Selenium::ActionChains;
use PolicyWeb::FrontendTest;
use PolicyWeb::BackendTest;
use JSON;


my $driver = PolicyWeb::FrontendTest->new(
    browser_name   => 'chrome',
    proxy => {
        proxyType => 'direct',
    },
    default_finder => 'id',
    javascript     => 1,
    extra_capabilities => {
        nativeEvents => 'false'
    }
);

prepare_export();
prepare_runtime_no_login();

##############################################################################
#
# - Login as guest.
# - Find combobox with all owners (by its id), open it by clicking
#   on its trigger and select owner "x" from the list of owners.
#
##############################################################################

$driver->login_as_guest_and_choose_owner( 'x' );


##############################################################################
#
# Find button "Eigene Dienste" and click on it.
# Find service with name "Test4" and click on that list item.
#
##############################################################################

$driver->click_element_ok( 'btn_own_services', 'id', 'Click on button "Eigene Dienste" ' );

my $service_grid = wait_until { $driver->find_element('grid_services' ) };

my $elements = $driver->find_child_elements( $service_grid, 'x-grid-cell', 'class' );

my @array = grep { $_->get_text() eq 'Test4' } @$elements;

$driver->move_to( element => $array[0] );
ok( $driver->click(), 'Select service "Test4"' );



##############################################################################
#
# Expand users by clicking on the appropriate checkbox (checkbox is found by
# its id).
# 
# Find rules grid and get content of first element of first column. These
# are IP addresses of the source which we want to check for being sorted.
#
##############################################################################

#my $cb = $driver->find_element( '//label[text()="User expandieren"]/preceding-sibling::input[@type="checkbox"]', 'xpath' );


$driver->click_element_ok( 'cb_expand_users', 'id', 'Click on checkbox "User expandieren"' );

my $value = $driver->get_grid_cell_value( 'grid_rules', 0, 'src' );

like( $value, qr/\d+/, "Got a grid value that seems to contain valid data" );



##############################################################################
#
# Check if data from grid is sorted. We only look at the first IP, so
# network mask and end of IP ranges are ignored for simplicity.
#
##############################################################################

# Data from grid cell should look like this (here yet unsorted):
#$VAR1 = '10.1.0.10<br>10.1.0.90-10.1.0.99<br>10.2.2.2<br>10.1.0.2<br>10.9.9.0/255.255.255.0';
my @values = split( '<br>', $value );
my @ips = map { s/^(\d+\.\d+\.\d+\.\d+)(.*)/$1/r } @values;
my @num_ips = map { ip2numeric($_) } @ips;
my @sorted_ips = sort { $a<=>$b } @num_ips;


is_deeply( \@num_ips, \@sorted_ips, "IP addresses in correct sort order." );




done_testing();




