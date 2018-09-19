
use strict;
use warnings;

package PolicyWeb::FrontendTest;

use base ("Test::Selenium::Remote::Driver");
use parent 'Exporter';    # imports and subclasses Exporter
use Selenium::Waiter qw/wait_until/;
use File::Temp qw/ tempfile tempdir /;
use Plack::Builder;
use HTTP::Request::Common;
use Plack::Test;
use PolicyWeb::Init qw( $port $SERVER);
use Data::Dumper;

our @EXPORT = qw(
    login_as_guest
    select_combobox_item
    get_grid_cell_value
    ip2numeric
    numeric2ip
    error
);

sub login_as_guest {
    my $driver   = shift;
    my $base_url = "http://$SERVER:$port/index.html";
    $driver->get($base_url);

    $driver->find_element( '//input[@name="email"]', "xpath" );
    $driver->find_element( '//input[@name="pass"]',  "xpath" );

    $driver->send_keys_to_active_element('guest');

    my $login_button
        = $driver->find_element( '//input[@value="Login"]', "xpath" );

    $login_button->click();

}

sub login_as_guest_and_choose_owner {
    my ( $driver, $owner ) = @_;
    $driver->login_as_guest();

    # The two waits below are necessary to avoid a race condition.
    # Without them, sometimes the combo box has not been rendered
    # yet and an error that "triggerEl of undefined cannot be found"
    # is raised.
    my $window = wait_until { $driver->find_element('win_owner') };
    wait_until {
        $driver->find_child_element( $window, 'combo_initial_owner' )
    };
    $driver->select_combobox_item( 'combo_initial_owner', $owner );
}

sub get_grid_cell_value_by_field_name {
    my ( $driver, $grid_id, $row, $field_name ) = @_;
    my $script
        = "return Ext.getCmp(\"$grid_id\").getStore().getAt($row).get('$field_name');";
    return $driver->execute_script($script);
}

sub get_grid_cell_value_by_row_and_column_index {
    my ( $driver, $grid_id, $row, $col ) = @_;
    my $script
        = "return Ext.getCmp(\"$grid_id\").headerCt.columnManager.columns[$col].dataIndex;";
    my $field_name = $driver->execute_script($script);
    return $driver->get_grid_cell_value_by_field_name( $grid_id, $row,
        $field_name );
}

sub select_grid_row_by_index {
    my ( $driver, $id, $row_index ) = @_;
}

sub select_grid_row_by_content {
    my ( $driver, $id, $to_match ) = @_;
}

sub select_combobox_item {
    my ( $driver, $combo_id, $item ) = @_;

    my $combo_query
        = "Ext.ComponentQuery.query(\"combobox[id='$combo_id']\")[0]";
    my $combo_trigger_id = "return " . $combo_query . ".triggerEl.first().id";
    my $dropdown_id      = "return " . $combo_query . ".picker.id";

    my $id_string = $driver->execute_script($combo_trigger_id);

    $driver->click_element_ok( $id_string, 'id',
        "Clicked on owner combo open trigger" );

    my $list_id = $driver->execute_script($dropdown_id);

    #Create a relative xpath to the boundlist item
    my $li
        = "//div[contains(\@id,'"
        . $list_id
        . "')]//li[contains(text(),'"
        . $item . "')]";

    #Select the dropdown item
    $driver->click_element_ok( $li, 'xpath',
        "Selected item $item from combo box" );
}

sub ip2numeric {

    # Convert IP address to numerical value.

    $_ = shift;

    if (m/\G(\d+)\.(\d+)\.(\d+)\.(\d+)/gc) {
        if ( $1 > 255 or $2 > 255 or $3 > 255 or $4 > 255 ) {
            error("Invalid IP address");
        }
        return unpack 'N', pack 'C4', $1, $2, $3, $4;
    }
    else {
        error("Expected IP address");
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

1;
