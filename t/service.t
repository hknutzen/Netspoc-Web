
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



#my $div = wait_until { $d->find_element('div', css') };

=head
{totalCount: 2, success: true, records: [{owner: [{name: "y"}], name: "FromKunde2HostInBigNet",…},…]}
records : [{owner: [{name: "y"}], name: "FromKunde2HostInBigNet",…},…]
success : true
totalCount : 2

=cut
    
#GET /daniel4/backend/service_list?active_owner=guest_owner&history=p1&chosen_networks=&expand_users=0&display_property=ip&filter_rules=1&relation=user

my %params = (
    active_owner     => 'guest_owner',
    history          => 'p1',
    chosen_networks  => '',
    expand_users     => 0,
    display_property => 'ip',
    filter_rules     => 1,
    relation         => 'user'
    );    

#%merged = (%A, %B);

my $SERVER   = "10.3.28.111";
my $base_url = "http://$SERVER/daniel4/";
my $app_url = "$base_url/app.html";
my $driver = PolicyWeb::FrontendTest->new(
    browser_name   => 'chrome',
    proxy => {
        proxyType => 'direct',
    },
    base_url       => $base_url,
    default_finder => 'id',
    javascript     => 1,
    extra_capabilities => {
        nativeEvents => 'false'
    }
);

#$driver->debug_on();

prepare_export();
prepare_runtime_no_login();

$driver->login_as_guest();

my $EXTCOMBOBOX = "Ext.ComponentQuery.query(\"combobox[displayField='alias']\")[1]";
my $COMBOBOXTRIGGERID = "return " . $EXTCOMBOBOX . ".triggerEl.elements[0].id" . ";";
my $OPTIONTOSELECT = "x";
my $DROPDOWNID = "return " . $EXTCOMBOBOX . ".picker.id;";

my $id_string = $driver->execute_script( $COMBOBOXTRIGGERID );

my $el = $driver->find_element( $id_string );

$driver->click_element_ok( $id_string, 'id', "Clicked on owner combo open trigger" );


#Create a relative xpath to the boundlist item
my $li = "//div[contains(\@id,'" . $id_string . "')]//li[contains(text(),'" . $OPTIONTOSELECT . "')]";

#Select the dropdown item
$driver->click_element_ok( $li, 'xpath', "Selected item $OPTIONTOSELECT from combo box" );


# Waith for button "Eigene Dienste" to show up, then click on that button.
#$el = wait_until { $driver->find_element('btn_own_services', 'id') };

ok( $driver->find_element('btn_own_services' ), "Found button \"Eigene Dienste\"" );

$driver->click_element_ok( 'btn_own_services', 'id', 'Click on button "Eigene Dienste" ' );



my $action_chains = Selenium::ActionChains->new(driver => $driver);
#$action_chains->move_to_element($other_element);
#$action_chains->click();
#$action_chains->perform;



my $service_grid = wait_until { $driver->find_element('grid_services', 'id') };

my $elements = $driver->find_child_elements( $service_grid, 'div[@class="x-grid-cell-inner"]', 'xpath' );

die Dumper( $elements );

map { error $_->get_text(); } @$elements;

    
done_testing();




=head
        //Trigger the ext combobox dropdown button for options to load
        click(buttonComboboxTrigger);
        //Once the dropdown is selected get the id of the boundlist
    }

    /**
     * Click the desired WebElement.
     *
     * @param element - expects the WebElement to be selected.
     */
    public static void click(WebElement element) {
        Actions action = new Actions(driver);
        action.click(element).build().perform();
    }
}

=cut
    
