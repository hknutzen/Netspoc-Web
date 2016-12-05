
use strict;
use warnings;


package PolicyWeb::FrontendTest;

use base ( "Test::Selenium::Remote::Driver" );
use parent 'Exporter'; # imports and subclasses Exporter

use Data::Dumper;

my $SERVER   = "10.3.28.111";
my $base_url = "http://$SERVER/daniel4/";

our @EXPORT = qw(
 login_as_guest
 select_combobox_item
 get_grid_cell_value
 ip2numeric
 numeric2ip
 default_params
 error
 );

my %params = (
    active_owner     => 'guest_owner',
    history          => 'p1',
    chosen_networks  => '',
    expand_users     => 0,
    display_property => 'ip',
    filter_rules     => 1,
    relation         => 'user'
    );    

sub login_as_guest {
    my $driver = shift;
    $driver->get( $base_url );
    
    $driver->find_element( '//input[@id="email"]', "xpath" );
    $driver->find_element( "pass" );
    
    $driver->send_keys_to_active_element('guest');
    
    my $login_button = $driver->find_element( '//input[@value="Login"]', "xpath" );
    
    $login_button->click();
    
}

sub login_as_guest_and_choose_owner {
    my ( $driver, $owner ) = @_;
    $driver->login_as_guest();
    $driver->select_combobox_item( 'combo_initial_owner', $owner );
}

sub get_grid_cell_value {
    my ( $driver, $grid_id, $row, $field_name ) = @_;
    my $script = "return Ext.getCmp(\"$grid_id\").getStore().getAt($row).get('$field_name');";
    return $driver->execute_script( $script );
}

sub select_combobox_item {
    my ( $driver, $combo_id, $item ) = @_;
    
    my $combo_query = "Ext.ComponentQuery.query(\"combobox[id='combo_initial_owner']\")[0]";
    my $combo_trigger_id = "return " . $combo_query . ".triggerEl.first().id";
    my $dropdown_id = "return " . $combo_query . ".picker.id";
    
    my $id_string = $driver->execute_script( $combo_trigger_id );
    
    $driver->click_element_ok( $id_string, 'id', "Clicked on owner combo open trigger" );
    
    my $list_id = $driver->execute_script($dropdown_id);
    
    #Create a relative xpath to the boundlist item
    my $li = "//div[contains(\@id,'" . $list_id . "')]//li[contains(text(),'" . $item . "')]";
    
    #Select the dropdown item
    $driver->click_element_ok( $li, 'xpath', "Selected item $item from combo box" );
}

sub ip2numeric {
    # Convert IP address to numerical value.
   
    $_ = shift;

    if ( m/\G(\d+)\.(\d+)\.(\d+)\.(\d+)/gc ) {
        if ( $1 > 255 or $2 > 255 or $3 > 255 or $4 > 255 ) {
            Netspoc::syntax_err( "Invalid IP address" );
        }
        return unpack 'N', pack 'C4',$1,$2,$3,$4;
    } else {
        Netspoc::syntax_err( "Expected IP address" );
    }
}

#
# Convert numerical value into an IP-address.
#
sub numeric2ip {
    my $ip = shift;
    return sprintf "%vd", pack 'N', $ip;
}


sub error {
    print STDERR @_, "\n";
}

sub default_params {
    return \%params;
}



1;

