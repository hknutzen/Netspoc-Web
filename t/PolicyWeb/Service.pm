
package PolicyWeb::Service;

use strict;
use warnings;
use Test::More;
use Selenium::Waiter qw/wait_until/;

# all test utilising window handler are disabled,
# until fixed (by Selenium or this perl dude or chromedriver or whatsoever who caused it)
# test_print_services
# test_print_all_services
# test_print_details

sub test {

    my $driver = shift;

    plan tests => 4;

    eval {

        wait_until { $driver->find_element('btn_services_tab')->click };

        # left and right panel
        my $lp;
        my $rp;
        eval {
            $lp = $driver->find_element('pnl_services');
            $rp = $driver->find_element('pnl_service_details');
        } or do { die("service tab panels not found\n$@"); };

        # cannot check further without buttons
        if ( !check_service_buttons( $driver, $lp, $rp ) ) {
            die("buttons are missing");
        }

        # go to own services tab
        $driver->move_click(
            $driver->find_child_element( $lp, 'btn_own_services' ) );

        check_own_services_grid( $driver, $lp );

        # test service details panel for 'Test4'
        service_details( $driver, $rp, );

        # test search functions
        search_tab($driver);
    };
    if ($@) { print $@ , "\n"; }
}

sub check_service_buttons {

    my ( $driver, $lp, $rp ) = @_;
    my $is_ok = 1;

    subtest "check service buttons" => sub {
        plan tests => 9;

        # check buttons on left panel
        $is_ok &= ok( $driver->find_child_element( $lp, 'btn_own_services' ),
            "found button:\t'Eigene'" );
        $is_ok &= ok( $driver->find_child_element( $lp, 'btn_used_services' ),
            "found button:\t'Genutzte'" );
        $is_ok &= ok( $driver->find_child_element( $lp, 'btn_usable_services' ),
            "found button:\t'Nutzbare'" );
        $is_ok &= ok( $driver->find_child_element( $lp, 'btn_search_services' ),
            "found button:\t'Suche'" );
        $is_ok &=
          ok( $driver->find_child_element( $lp, 'btn_services_print_all' ),
            "found button:\tprint all" );
        $is_ok &= ok( $driver->find_child_element( $lp, 'btn_services_print' ),
            "found button:\tprint" );

        # check buttons on right panel
        $is_ok &= ok( $driver->find_child_element( $rp, 'btn_service_details' ),
            "found button:\t'Details zum Dienst'" );
        $is_ok &= ok(
            $driver->find_child_element( $rp, 'btn_service_user' ),
            "found button:\t'Benutzer (User) des Dienstes'"
        );
        $is_ok &= ok( $driver->find_child_element( $rp, 'btn_print_rules', ),
            "found button:\tprint rules" );
    };
    return $is_ok;
}

sub check_own_services_grid {

    my ( $driver, $lp ) = @_;

    my @grid =
      $driver->find_child_elements( $lp, './/*[contains(@class, "x-grid-row")]',
        'xpath' );
    my $grid_head =
      $driver->find_child_element( $lp, 'x-column-header', 'class' );
    my $grid_head_text = $grid_head->get_text;

    subtest "check own services grid" => sub {

        #plan tests => 6;

        ok( $grid_head_text =~ 'Dienstname\s\(Anzahl:\s\d+\)',
            "found header:\town services grid" );
        ok( $grid_head_text =~ /([0-9]+)/ ? ( $1 eq scalar @grid ) : 0,
            "header contains number of elements" );

        my @contains = (
            "Test1", "Test10", "Test11", "Test2", "Test3", "Test3a",
            "Test4", "Test5",  "Test6",  "Test7", "Test8", "Test9"
        );
        if (
            !ok(
                $driver->grid_contains( $lp, 1, 0, \@contains ),
                "grid contains all tests services"
            )
          )
        {
            die("own services missing test");
        }

        my $is_ok = 1;
        $is_ok &= $driver->is_grid_in_order( \@grid, 1, 1, -1, 0 );
        $driver->move_to( element => $grid_head );
        sleep
          4;   # without 1sec sleep cursor clicks on info window from tab button
        $driver->click;
        @grid =
          $driver->find_child_elements( $lp,
            './/*[contains(@class, "x-grid-row")]', 'xpath' );
        $is_ok &= $driver->is_grid_in_order( \@grid, 1, 1, 1, 0 );

        if ( !ok( $is_ok, "grid changes correctly" ) ) {
            die("own service grid");
        }

        #sleep 50;

        # test_print_services($driver, $lp, $grid_head_text, \@grid);

        # test_print_all_services($driver, \@grid);

    };
}

sub test_print_services {

    my $driver        = shift;
    my $lp            = shift;
    my $service_head  = shift;
    my @service_cells = map { $_->get_text } @{ (shift) };

    $driver->find_child_element( $lp, 'btn_services_print' )->click;

    my $handles = $driver->get_window_handles;
    $driver->switch_to_window( $handles->[1] );

    subtest "print services" => sub {
        plan tests => 5;

        ok( $driver->get_title() eq "Druckansicht", "switched to a print tab" );

        my $winprin = $driver->find_element( 'x-ux-grid-printer', 'class' );

        my @p_bnts = $driver->find_child_elements(
            $driver->find_child_element(
                $winprin, 'x-ux-grid-printer-noprint', 'class'
            ),
            '//a', 'xpath'
        );

        ok( $p_bnts[0]->get_text eq 'Drucken',   "found button:\t'Drucken'" );
        ok( $p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'" );

        my @print_cells =
          map { $_->get_text }
          $driver->find_child_elements( $winprin, '//td', 'xpath' );

        my $same_header =
          $service_head eq
          $driver->find_child_element( $winprin, '//th', 'xpath' )->get_text;

        ok(
            $same_header
              && $driver->comp_array( \@service_cells, \@print_cells ),
            "print preview contains all information"
        );

        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok( scalar @{$handles} == 1, "button clicked:\t'Schließen'" );

        $driver->switch_to_window( $handles->[0] );
    };
}

sub test_print_all_services {

    my $driver = shift;

    subtest "test print all services" => sub {
        plan tests => 8;

        my $cb_expand_users = $driver->find_element('cb_expand_users');
        my $cb_show_names   = $driver->find_element('cb_show_names');

        my $pnl_services = $driver->find_element('pnl_services');
        $driver->find_child_element( $pnl_services, 'x-column-header', 'class' )
          ->click;
        my @services = map { $_->get_text }
          $driver->find_child_elements( $pnl_services, 'x-grid-cell', 'class' );

        $driver->find_element('btn_services_print_all')->click;

        my $pnl_print = $driver->find_element('window_print_services');
        ok( $pnl_print, "all services opend for services + details" );

        my @all_services = map { $_->get_text } $driver->find_child_elements(
            $pnl_print,
'.//*[contains(@class, "x-grid-group-title") or contains(@class, "x-grid-data-row")]',
            'xpath'
        );

        #my $regex = 'permit\sUser\s(network|any|host):.+\s(udp|tcp)\s\d+';
        my $regex =
'permit\sUser\s(User|(\d+\.\d+\.\d+\.\d+(\/\d+\.\d+\.\d+\.\d+)?))\s(udp|tcp)\s\d+';

        ok( check_all_services( \@all_services, \@services, $regex ),
            "all services contains correct data" );

        # cannot find close button for print preview, if the window is to small
        $driver->find_child_element( $pnl_print,
            './/*[contains(@class, "x-tool-after-title")]', 'xpath' )->click;

        # print_all_services should now conain diffrent data after:
        $cb_expand_users->click;
        $cb_show_names->click;

        $driver->find_element('btn_services_print_all')->click;
        $pnl_print = $driver->find_element('window_print_services');

        @all_services = map { $_->get_text } $driver->find_child_elements(
            $pnl_print,
'.//*[contains(@class, "x-grid-group-title") or contains(@class, "x-grid-data-row")]',
            'xpath'
        );

        $regex = 'permit\s((network|any|host|interface):.+\s)+(udp|tcp)\s\d+';

        ok(
            check_all_services( \@all_services, \@services, $regex ),
"all services contains correct data for diffrent options at service details"
        );

        # check if the print_previews contains the same data
        $driver->find_child_element( $pnl_print,
            './/a[contains(@id, "printbutton")]', 'xpath' )->click;
        my $handles = $driver->get_window_handles;
        $driver->switch_to_window( $handles->[1] );

        ok( $driver->get_title() eq "Druckansicht", "switched to a print tab" );

        my $winprin = $driver->find_element( 'x-ux-grid-printer', 'class' );

        my @p_bnts = $driver->find_child_elements(
            $driver->find_child_element(
                $winprin, 'x-ux-grid-printer-noprint', 'class'
            ),
            '//a', 'xpath'
        );

        ok( $p_bnts[0]->get_text eq 'Drucken',   "found button:\t'Drucken'" );
        ok( $p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'" );

        my @print_cells =
          map { $_->get_text }
          $driver->find_child_elements( $winprin, '//tr', 'xpath' );

        my @slice = @print_cells[ 2 .. scalar @print_cells - 1 ];
        ok(
            $driver->comp_array( \@slice, \@all_services ),
            "print preview contains all information"
        );

        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok( scalar @{$handles} == 1, "button clicked:\t'Schließen'" );
        $driver->switch_to_window( $handles->[0] );

        # cannot find close button for print preview, if the window is to small
        $driver->find_child_element( $pnl_print,
            './/*[contains(@class, "x-tool-after-title")]', 'xpath' )->click;

        # back to normal
        $cb_expand_users->click;
        $cb_show_names->click;
    };

}

sub check_all_services {

    my @pap      = @{ (shift) };
    my @services = @{ (shift) };
    my $regex    = shift;

    my $count = 0;
    my $is_ok = 1;

    for ( my $i = 0 ; $i < @pap ; $i++ ) {
        if ( $pap[$i] =~ /Dienst:\s(.*)\s\((\d+)\sRegeln?\)/ ) {

            # $1 : service name
            # $2 : amount of rules
            # print "1:$1\n2:$2\n";

            if ( $1 ne $services[ $count++ ] ) {
                print "$1 ne $services[$count-1]\n";
                $is_ok = 0;
                last;
            }

            for ( my $j = 1 ; $j <= $2 ; $j++ ) {
                if ( !( $pap[ $j + $i ] =~ /$regex/ ) ) {
                    print "-> $pap[$j+$i] \n!=~ $regex\n";
                    $is_ok = 0;
                    last;
                }
            }

            $i += $2;
        }
        else {
            print "something is wrong at index $i:\n$pap[$i]\n";
            $is_ok = 0;
            last;
        }
    }
    return $is_ok;
}

sub service_details {

    my $driver = shift;

    # some weird bug removes add and delete column in service details
    # if network(s) were selceted before
    $driver->find_element('btn_own_networks_tab')->click;
    my @networks_grid_cells =
      $driver->find_child_elements( $driver->find_element('grid_own_networks'),
        'x-grid-cell', 'class' );

    $driver->select_by_key( \@networks_grid_cells, 4, 2, "network:KUNDE1" );
    $driver->find_element('btn_confirm_network_selection')->click;
    $driver->find_element('btn_cancel_network_selection')->click;
    $driver->find_element('btn_services_tab')->click;

    # ^ could be deletet if own_networks runs before service

    my $lp      = $driver->find_element('pnl_services');
    my $rp      = $driver->find_element('pnl_service_details');
    my $det_bnt = $driver->find_child_element( $rp, 'btn_service_details' );
    my $use_bnt = $driver->find_child_element( $rp, 'btn_service_user' );
    my @service_grid =
      $driver->find_child_elements( $lp, './/*[contains(@class, "x-grid-row")]',
        'xpath' );

    subtest "service details" => sub {

        # plan tests => 12;

        $driver->select_by_key( \@service_grid, 1, 0, "Test4" );

        ok( $driver->find_child_element( $rp, 'cb_expand_users' ),
            "found checkbox:\texpand user" );
        ok( $driver->find_child_element( $rp, 'cb_show_names' ),
            "found checkbox:\tshow names" );
        ok( $driver->find_child_element( $rp, 'cb_filter_search' ),
            "found checkbox:\tfilter search" );

        #####

        # service details

        my $details =
          $driver->find_child_element( $rp, 'pnl_service_details_inner' );

        ok( $details->get_text =~ 'Name:\sBeschreibung:\sVerantwortung:',
            "found panel:\tservice details" );
        my @pseudo_input = $driver->find_child_elements( $details,
            './/input[contains(@id, "inputEl")]', 'xpath' );
        use Data::Dumper;

#Dass die inputs "hidden" sind, ist hier das Problem!
#Eventuelle Lösung: execute_script
#https://stackoverflow.com/questions/19385721/how-to-get-hidden-values-in-webdriver-using-javascript
#String script =
#  "return document.getElementById('code').getAttribute('value');";
#String value =
#  ( (JavascriptExecutor) driver ) . executeScript(script) . toString();
# Deshalb diese lokale Funktion. Wir gehen über Javascript, statt
# get_value auf das Element anzuwenden.
        my $get_val = sub {
            my ($index) = @_;
            my $id      = $pseudo_input[$index]->get_attribute("id");
            my $script  = q{
              var arg1 = arguments[0];
              var elem = window.document.getElementById(arg1);
              return elem.value;
            };
            return $driver->execute_script( $script, $id );
        };
        ok( $get_val->(0) eq 'Test4',    "Name:\t\tTest4" );
        ok( $get_val->(1) eq 'Your foo', "Beschreibung:\tYour foo" );

=head
        ok( $pseudo_input[2]->get_value eq 'y', "Verantwortung:\ty" );
        $driver->find_child_element( $details,
            'btn_switch_service_responsibility' )->click;
        ok(
            $pseudo_input[2]->get_value eq 'z',
            "responsibility changed from y to z"
        );
=cut

        #####

        my $grid = $driver->find_child_element( $rp, 'grid_rules' );
        my @gch  = $driver->find_child_elements(
            $grid,
'.//*[contains(@class, "x-column-header") and not(contains(@id, "El"))]',
            'xpath'
        );
        my @service_rules =
          $driver->find_child_elements( $grid, './/td', 'xpath' );

        #####

        # check header
        my $is_ok = 1;
        $is_ok &= $gch[0]->get_text eq "Aktion";
        $is_ok &= $gch[1]->get_text eq "Quelle";
        $is_ok &= $gch[2]->get_text eq "Ziel";
        $is_ok &= $gch[3]->get_text eq "Protokoll";
        ok( $is_ok, "details grid header are correct" );

        #####

        # check syntax in grid
        my @regex = (
            'permit',
            'User',
'(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)',
            '(udp|tcp)\s\d+'
        );
        $is_ok = 1;
        $is_ok = $driver->check_syntax_grid( \@service_rules, 5, 0, \@regex );

        $driver->find_child_element( $rp, 'cb_expand_users' )->click;

        #regex matches anschauen
        $regex[1] =
'((2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)(\-\/(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d))?)';
        @service_rules =
          $driver->find_child_elements( $grid, './/td', 'xpath' );
        $is_ok &= $driver->check_syntax_grid( \@service_rules, 5, 0, \@regex );

        $driver->find_child_element( $rp, 'cb_show_names' )->click;
        $regex[1] = '(any:.+|network:.+|interface:.+|host:.+)';
        $regex[2] = '(any:.+|network:.+|interface:.+|host:.+)';
        @service_rules =
          $driver->find_child_elements( $grid, './/td', 'xpath' );
        $is_ok &= $driver->check_syntax_grid( \@service_rules, 5, 0, \@regex );

      TODO: {
            local $TODO = "Bug in ExtJS swallowes add and delete buttons";
            ok( $is_ok, "detail grid syntax ok" );
        }

=head=
        #####

        # Verantwortliche
        #use Data::Dumper;
        #die Dumper(
        #    $driver->find_child_element( $rp, 'ownerEmails' )->get_text );
        ok(
            $driver->find_child_element( $rp, 'ownerEmails' )->get_text =~
              'Verantwortliche\sf.r\sz\sguest',
            "found panel:\tresponsible email contact"
        );

        # test_print_details($driver, $grid);
=cut=

    };
}

sub test_print_details {

    my $driver = shift;
    my $grid   = shift;

    subtest "test print details" => sub {

        plan tests => 6;

        my @grid_rules =
          map { $_->get_text }
          $driver->find_child_elements( $grid, './/td', 'xpath' );

        $driver->find_element('btn_print_rules')->click;

        my $handles = $driver->get_window_handles;
        $driver->switch_to_window( $handles->[1] );

        my $winprin = $driver->find_element( 'x-ux-grid-printer', 'class' );

        my @p_bnts = $driver->find_child_elements(
            $driver->find_child_element(
                $winprin, 'x-ux-grid-printer-noprint', 'class'
            ),
            '//a', 'xpath'
        );

        ok( $p_bnts[0]->get_text eq 'Drucken',   "found button:\t'Drucken'" );
        ok( $p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'" );

        my @header = ( "Aktion", "Quelle", "Ziel", "Protokoll" );
        my @print_header =
          map { $_->get_text }
          $driver->find_child_elements( $winprin, './/th', 'xpath' );
        ok( $driver->comp_array( \@header, \@print_header ),
            "print header are correct" );

        my @print_cells =
          map { $_->get_text }
          $driver->find_child_elements( $winprin, './/td', 'xpath' );

        ok(
            $driver->comp_array( \@grid_rules, \@print_cells ),
            "print preview contains all service rules"
        );

        # change service details to check if print preview also changes
        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok( scalar @{$handles} == 1, "button clicked:\t'Schließen'" );
        $driver->switch_to_window( $handles->[0] );

        sleep 5;    # some infotext, which does not disapear earlier

        $driver->find_element('cb_expand_users')->click;
        $driver->find_element('cb_show_names')->click;

        @grid_rules =
          map { $_->get_text }
          $driver->find_child_elements( $grid, './/td', 'xpath' );

        $driver->find_element('btn_print_rules')->click;
        $handles = $driver->get_window_handles;
        $driver->switch_to_window( $handles->[1] );
        $winprin = $driver->find_element( 'x-ux-grid-printer', 'class' );
        @p_bnts  = $driver->find_child_elements(
            $driver->find_child_element(
                $winprin, 'x-ux-grid-printer-noprint', 'class'
            ),
            '//a', 'xpath'
        );

        @print_cells =
          map { $_->get_text }
          $driver->find_child_elements( $winprin, './/td', 'xpath' );

        ok(
            $driver->comp_array( \@grid_rules, \@print_cells ),
            "print preview contains service rules after change"
        );

        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        $driver->switch_to_window( $handles->[0] );

        $driver->find_element('cb_expand_users')->click;
        $driver->find_element('cb_show_names')->click;
    };
}

sub search_tab {

    my $driver = shift;

    # -------------
    # Todo:
    # (Nutzbare)
    #   Portranges
    # Befristete Dienste
    # -------------

    subtest search => sub {
        plan tests => 33;
        $driver->find_element('btn_search_services')->click;
        my $search_window = $driver->find_element('window_search');
        if ( !ok( $search_window, "found search 'window'" ) ) {
            die("no search window -> no search");
        }
        ok( $driver->find_child_element( $search_window, 'txtf_search_ip1' ),
            "found input field:\tip1" );
        ok( $driver->find_child_element( $search_window, 'txtf_search_ip2' ),
            "found input field:\tip2" );
        ok(
            $driver->find_child_element( $search_window, 'txtf_search_proto' ),
            "found input field:\tprotocol"
        );
        ok(
            $driver->find_child_element( $search_window, 'cb_search_supernet' ),
            "found checkbox:\tsearch supernet"
        );
        ok( $driver->find_child_element( $search_window, 'cb_search_subnet' ),
            "found checkbox:\tsearch subnet" );
        ok( $driver->find_child_element( $search_window, 'cb_search_range' ),
            "found checkbox:\tsearch port range" );
        ok( $driver->find_child_element( $search_window, 'cb_search_own' ),
            "found checkbox:\tsearch own services" );
        ok( $driver->find_child_element( $search_window, 'cb_search_used' ),
            "found checkbox:\tsearch used services" );
        ok( $driver->find_child_element( $search_window, 'cb_search_usable' ),
            "found checkbox:\tsearch usable services" );
        ok(
            $driver->find_child_element( $search_window, 'cb_search_limited' ),
            "found checkbox:\tsearch temporary services"
        );
        ok(
            $driver->find_child_element(
                $search_window, 'cb_search_case_sensitive'
            ),
            "found checkbox:\tsearch case sensitive"
        );
        ok( $driver->find_child_element( $search_window, 'cb_search_exact' ),
            "found checkbox:\tsearch exact" );
        ok(
            $driver->find_child_element(
                $search_window, 'cb_search_keep_foreground'
            ),
            "found checkbox:\tkeep search in foreground"
        );
        ok( $driver->find_child_element( $search_window, 'btn_search_start' ),
            "found button:\tstart search" );

        $driver->find_child_element( $search_window,
            'cb_search_keep_foreground' )->click;
        $driver->find_child_element( $search_window, 'cb_search_used' )->click;
        $driver->find_child_element( $search_window, 'cb_search_subnet' )
          ->click;

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('10.2.2.2');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 4, "IP 1 = '10.2.2.2'\t=> 4 services" );

        if ( !ok( $search_window->is_displayed, "keep search in foreground" ) )
        {
            die("search window vanished:\n$@");
        }

        $driver->find_child_element( $search_window, 'cb_search_supernet' )
          ->click;
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 8,
            "IP 1 = '10.2.2.2'\n\t& supernet\t\t=> 8 services" );

        $driver->find_child_element( $search_window, 'txtf_search_ip2-inputEl' )
          ->send_keys('10.9.9.0');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;

=head=
        search_result_ok( $driver, 2,
        "IP 1 = '10.2.2.2'\n\tIP 2 = '10.9.9.0'\n\t& supernet\t\t=> 2 services"
                );

        $driver->find_child_element( $search_window,
            'txtf_search_proto-inputEl' )->send_keys('83');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 1,
"IP 1 = '10.2.2.2'\n\tIP 2 = '10.9.9.0'\n\tProtokoll = 83\n\t& supernet\t\t=> 2 services"
        );
=cut=

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip2-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window,
            'txtf_search_proto-inputEl' )->clear;
        $driver->find_child_element( $search_window, 'cb_search_supernet' )
          ->click;

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('sub1');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 1, "IP 1 = 'sub1'\t\t=> 1 service" );

        $driver->find_child_element( $search_window,
            'cb_search_case_sensitive' )->click;
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 0,
            "IP 1 = 'sub1'\n\t& case sensitive\t=> 0 service" );

        # close popup
        $driver->find_child_element(
            $driver->find_element( 'x-message-box', 'class' ),
            'x-btn-button', 'class' )->click;
        pass("popup closed:\t'Ihre Suche ergab keine Treffer!'");

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('Sub1');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 1,
            "IP 1 = 'Sub1'\n\t& case sensitive\t=> 1 service" );

        $driver->find_child_element( $search_window,
            'cb_search_case_sensitive' )->click;
        $driver->find_child_element( $search_window, 'cb_search_exact' )->click;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('sub1');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 0,
            "IP 1 = 'sub1'\n\t& exact\t\t\t=> 0 service" );

        # close popup
        $driver->find_child_element(
            $driver->find_element( 'x-message-box', 'class' ),
            'x-btn-button', 'class' )->click;

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('any:sub1');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 1,
            "IP 1 = 'any:sub1'\n\t& exact\t\t\t=> 1 service" );

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('10.1.0.0/16');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 3,
            "IP 1 = '10.1.0.0/16'\t=> Find 3 services" );

        $driver->find_child_element( $search_window, 'cb_search_subnet' )
          ->click;
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 13,
            "IP 1 = '10.1.0.0/16'\n\t& subnet\t\t=> Find 13 services" );

        $driver->find_child_element( $search_window, 'cb_search_subnet' )
          ->click;
        $driver->find_child_element( $search_window, 'cb_search_exact' )->click;

        my @search_tabs =
          $driver->find_child_elements( $search_window, 'x-tab-inner',
            'class' );

        $search_tabs[1]->click;
        pass("switched to second search tab");

        $driver->find_element('txtf_search_string-inputEl')->send_keys('foo');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 2,
            "search key = 'foo'\n\t& description\t\t=> 2 elements" );

        $driver->find_child_element( $search_window, 'cb_search_description' )
          ->click;
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 0, "search key = 'foo'\t=> 0 elements" );

        # close popup
        $driver->find_child_element(
            $driver->find_element( 'x-message-box', 'class' ),
            'x-btn-button', 'class' )->click;

        $driver->find_element('txtf_search_string-inputEl')->clear;
        $driver->find_element('txtf_search_string-inputEl')->send_keys('Test9');
        $driver->find_child_element( $search_window,
            'cb_search_keep_foreground' )->click;
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;
        search_result_ok( $driver, 1, "search key = 'Test9'\t=> 1 elements" );

        ok(
            !$search_window->is_displayed,
            "search window vanished after search"
        );

        $driver->find_element('btn_search_services')->click;
        $search_tabs[0]->click;
        pass("switched to first search tab");

        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->clear;
        $driver->find_child_element( $search_window, 'txtf_search_ip1-inputEl' )
          ->send_keys('10.2.2.2');
        $driver->find_child_element( $search_window, 'btn_search_start' )
          ->click;

        # filter nach Suche

        my @service_grid =
          $driver->find_child_elements( $driver->find_element('pnl_services'),
            'x-grid-data-row', 'class' );

        $driver->select_by_key( \@service_grid, 1, 0, "Test9" );

        $driver->find_element('cb_show_names')->click;

        my $grid_rules = $driver->find_element('grid_rules-body');
        my @zeug =
          $driver->find_child_elements( $grid_rules, 'x-grid-cell', 'class' );
        my $is_ok = 1;
        sleep 10;
        $is_ok &= $zeug[0]->get_text eq "permit";
        $is_ok &= $zeug[1]->get_text eq "10.2.2.2";
        $is_ok &= $zeug[2]->get_text eq "10.2.2.2";
        $is_ok &= $zeug[3]->get_text eq "udp 83";

        if ( !$is_ok ) {
            print "0: ", $zeug[0]->get_text,
              "\n1: ", $zeug[1]->get_text,
              "\n2: ", $zeug[2]->get_text,
              "\n3: ", $zeug[3]->get_text, "\n";
        }

        $driver->find_element('cb_filter_search')->click;
        @zeug =
          $driver->find_child_elements( $grid_rules, 'x-grid-cell', 'class' );

        $is_ok &= $zeug[0]->get_text eq "permit";
        $is_ok &= $zeug[1]->get_text eq "10.1.0.10\n10.2.2.2";
        $is_ok &= $zeug[2]->get_text eq "10.1.0.10\n10.2.2.2";
        $is_ok &= $zeug[3]->get_text eq "udp 83";
        if ( !$is_ok ) {
            print "0: ", $zeug[0]->get_text,
              "\n1: ", $zeug[1]->get_text,
              "\n2: ", $zeug[2]->get_text,
              "\n3: ", $zeug[3]->get_text, "\n";
        }

        ok( $is_ok, "filter for search correcty" );

    };
}

sub search_result_ok {
    my ( $driver, $expected, $ok_text ) = @_;
    eval {
        my @grid =
          $driver->find_child_elements(
            $driver->find_element('pnl_services-body'),
            './/tr', 'xpath' );
        my $got = scalar @grid;
        if ( !ok( $got eq $expected, $ok_text ) ) {
            print "$ok_text: got $got, expected $expected\n";
        }
    };
    if ($@) { die("something went wrong in 'search_result_ok':\n$@") }
}

1;
