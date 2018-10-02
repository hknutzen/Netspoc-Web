
package PolicyWeb::Service;

use strict;
use warnings;
use Test::More;
use Selenium::Waiter qw/wait_until/;

sub test {

    my $driver = shift;

    plan tests => 4;

    eval {

        $driver->find_element('btn_services_tab')->click;

        # left and right panel
        my $lp;
        my $rp;
        eval {
            $lp = $driver->find_element('pnl_services');
            $rp = $driver->find_element('pnl_service_details');
        } or do { die("service tab panels not found\n$@"); };

        # cannot check further without buttons
        if (!check_service_buttons($driver, $lp, $rp)) { die("buttons are missing"); }

        # go to own services tab
        $driver->move_click($driver->find_child_element($lp, 'btn_own_services'));

        check_own_services_grid($driver, $lp);

        # test service details panel for 'Test4'
        service_details($driver, $rp,);

        # test search functions
        search_tab($driver);
    };
    if ($@) { print $@ , "\n"; }
}

sub check_service_buttons {

    my ($driver, $lp, $rp) = @_;
    my $is_ok = 1;

    subtest "check service buttons" => sub {
        plan tests => 11;

        # check buttons on left panel
        $is_ok &= ok($driver->find_child_element($lp, 'btn_own_services'),
                     "found button:\t'Eigene'");
        $is_ok &= ok($driver->find_child_element($lp, 'btn_used_services'),
                     "found button:\t'Genutzte'");
        $is_ok &= ok($driver->find_child_element($lp, 'btn_usable_services'),
                     "found button:\t'Nutzbare'");
        $is_ok &= ok($driver->find_child_element($lp, 'btn_search_services'),
                     "found button:\t'Suche'");
        $is_ok &= ok($driver->find_child_element($lp, 'btn_services_print_all'),
                     "found button:\tprint all");
        $is_ok &= ok($driver->find_child_element($lp, 'btn_services_print'),
                     "found button:\tprint");

        # check buttons on right panel
        $is_ok &= ok($driver->find_child_element($rp, 'btn_service_details'),
                     "found button:\t'Details zum Dienst'");
        $is_ok &= ok($driver->find_child_element($rp, 'btn_service_user'),
                     "found button:\t'Benutzer (User) des Dienstes'");
        $is_ok &= ok($driver->find_child_element($rp, 'btn_print_rules',),
                     "found button:\tprint rules");
        $is_ok &= ok($driver->find_child_element($rp, 'btn_service_user_add'),
                     "found button:\tadd user to service");
        $is_ok &= ok($driver->find_child_element($rp, 'btn_service_user_del'),
                     "found button:\tdelete user from service");
    };
    return $is_ok;
}

sub check_own_services_grid {

    my ($driver, $lp) = @_;

    my @grid =
      $driver->find_child_elements($lp, './/*[contains(@class, "x-grid-row")]',
                                   'xpath');
    my $grid_head = $driver->find_child_element($lp, 'x-column-header', 'class');
    my $grid_head_text = $grid_head->get_text;

    subtest "check own services grid" => sub {

        #plan tests => 6;

        ok($grid_head_text =~ 'Dienstname\s\(Anzahl:\s\d+\)',
            "found header:\town services grid");
        ok($grid_head_text =~ /([0-9]+)/ ? ($1 eq scalar @grid) : 0,
            "header contains number of elements");

        my @contains = ("Test1", "Test10", "Test11", "Test2", "Test3", "Test3a",
                        "Test4", "Test5",  "Test6",  "Test7", "Test8", "Test9");
        if (
            !ok($driver->grid_contains(\$lp, \1, \0, \@contains),
                "grid contains all tests services")
           )
        {
            die("own services missing test");
        }

        my $is_ok = 1;
        $is_ok &= $driver->is_grid_in_order(\@grid, \1, \1, \-1, \0);
        $driver->move_to(element => $grid_head);
        sleep 1;    # without 1sec sleep cursor clicks on info window from tab button
        $driver->click;
        @grid =
          $driver->find_child_elements($lp, './/*[contains(@class, "x-grid-row")]',
                                       'xpath');
        $is_ok &= $driver->is_grid_in_order(\@grid, \1, \1, \1, \0);

        if (!ok($is_ok, "grid changes correctly")) {
            die("own service grid");
        }

        test_print_services($driver, $lp, $grid_head_text, \@grid);

        #test_print_all_services($driver);

    };
}

sub test_print_services {

    my $driver        = shift;
    my $lp            = shift;
    my $service_head  = shift;
    my @service_cells = map { $_->get_text } @{ (shift) };

    $driver->find_child_element($lp, 'btn_services_print')->click;

    my $handles = $driver->get_window_handles;
    $driver->switch_to_window($handles->[1]);

    subtest "print services" => sub {
        plan tests => 5;

        ok($driver->get_title() eq "Druckansicht", "switched to print tab");

        my $winprin = $driver->find_element('x-ux-grid-printer', 'class');

        my @p_bnts =
          $driver->find_child_elements(
                                       $driver->find_child_element(
                                                  $winprin, 'x-ux-grid-printer-noprint', 'class'
                                                                  ),
                                       '//a', 'xpath'
                                      );

        ok($p_bnts[0]->get_text eq 'Drucken',   "found button:\t'Drucken'");
        ok($p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'");

        my @print_cells = $driver->find_child_elements($winprin, '//td', 'xpath');

        my $same_header =
          $service_head eq
          $driver->find_child_element($winprin, '//th', 'xpath')->get_text;

        ok($same_header && $driver->comp_array(\@service_cells, \@print_cells),
            "print services contains all information");

        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok(scalar @{$handles} == 1, "button clicked:\t'Schließen'");

        $driver->switch_to_window($handles->[0]);
    };
}

sub test_print_all_services {

    my $driver = shift;

    subtest "test print all services" => sub {
        plan tests => 1;
        $driver->find_element('btn_services_print_all')->click;

        my $pnl_print = $driver->find_element('window_print_services');
        ok($pnl_print, "print preview opend for services + details");

        my @weird_grid = $driver->find_child_elements($pnl_print, './/tr', 'xpath');

        my @services;

        my $check;

        my $index = -1;

        for (my $i = 0 ; $i < @weird_grid ; $i++) {

            #print "$i: ", $weird_grid[$i]->get_text, "\n";

            my @temp = split /\n/, $weird_grid[$i]->get_text;

            if ($temp[0] =~ /\((d+)\sRegeln?\)/) { $index++; push @services, [] }

            #   push $services[ $index ], @temp;

            #for (my $j = 0; $j < @temp; $j++) {
            #    print "\t$j: ", $temp[$j], "\n";
            #}
        }
        print "-----------\n";

        for (my $i = 0 ; $i < @services ; $i++) {

            # print "$i: ", $services[$i], "\n";
        }
    };

}

sub service_details {

    my $driver = shift;

    # some weird bug removes add and delete column in service details
    # if network(s) were selceted before
    $driver->find_element('btn_own_networks_tab')->click;
    my @networks_grid_cells =
      $driver->find_child_elements($driver->find_element('grid_own_networks'),
                                   'x-grid-cell', 'class');
    $driver->select_by_name(\@networks_grid_cells, \4, \2, \"network:KUNDE1");
    $driver->find_element('btn_confirm_network_selection')->click;
    $driver->find_element('btn_cancel_network_selection')->click;
    $driver->find_element('btn_services_tab')->click;
    # ^ could be deletet if own_networks runs before service

    my $lp      = $driver->find_element('pnl_services');
    my $rp      = $driver->find_element('pnl_service_details');
    my $det_bnt = $driver->find_child_element($rp, 'btn_service_details');
    my $use_bnt = $driver->find_child_element($rp, 'btn_service_user');
    my @serice_grid =
      $driver->find_child_elements($lp, './/*[contains(@class, "x-grid-row")]',
                                   'xpath');

    subtest "service details" => sub {
        plan tests => 11;

        $driver->select_by_name(\@serice_grid, \1, \0, \"Test4");

        ok($driver->find_child_element($rp, 'cb_expand_users'),
            "found checkbox:\texpand user");
        ok($driver->find_child_element($rp, 'cb_show_names'),
            "found checkbox:\tshow names");
        ok($driver->find_child_element($rp, 'cb_filter_search'),
            "found checkbox:\tfilter search");

        #####

        # service details

        my $details = $driver->find_child_element($rp, 'pnl_service_details_inner');

        ok($details->get_text =~ 'Name:\sBeschreibung:\sVerantwortung:',
            "found panel:\tservice details");

        my @pseudo_input = $driver->find_child_elements($details,
                                       './/input[not(contains(@id, "hidden"))]', 'xpath');

        ok($pseudo_input[0]->get_value eq 'Test4',    "Name:\t\tTest4");
        ok($pseudo_input[1]->get_value eq 'Your foo', "Beschreibung:\tYour foo");
        ok($pseudo_input[2]->get_value eq 'y',        "Verantwortung:\ty");
        $driver->find_child_element($details, 'btn_switch_service_responsibility')
          ->click;
        ok($pseudo_input[2]->get_value eq 'z', "responsibility changed from y to z");

        #####

        my $grid = $driver->find_child_element($rp, 'grid_rules');
        my @gch =
          $driver->find_child_elements($grid,
                './/*[contains(@class, "x-column-header") and not(contains(@id, "El"))]',
                'xpath');
        my @gcc = $driver->find_child_elements($grid, './/td', 'xpath');

        #####

        # check header
        my $is_ok = 1;
        $is_ok &= $gch[0]->get_text eq "Aktion";
        $is_ok &= $gch[1]->get_text eq "Quelle";
        $is_ok &= $gch[2]->get_text eq "Ziel";
        $is_ok &= $gch[3]->get_text eq "Protokoll";
        $is_ok &= $gch[4]->get_attribute('id') =~ /actioncolumn/;
        ok($is_ok, "details grid header are correct");

        #####

        # check syntax in grid
        my @regex = (
            'permit',
            'User',
'(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)',
            '(udp|tcp)\s\d+', 'wtf:)'
        );
        $is_ok = 1;
        $is_ok = $driver->check_sytax_grid(\@gcc, \4, \0, \@regex);

        $driver->find_child_element($rp, 'cb_expand_users')->click;

        #regex matches anschauen
        $regex[1] =
'((2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)(\-\/(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d)\.(2(0..5)(0..5)|1\d\d|\d\d|\d))?)';
        @gcc = $driver->find_child_elements($grid, './/td', 'xpath');
        $is_ok &= $driver->check_sytax_grid(\@gcc, \5, \0, \@regex);
        $driver->find_child_element($rp, 'cb_show_names')->click;
        $regex[1] = '(any:.+|network:.+|interface:.+|host:.+)';
        $regex[2] = '(any:.+|network:.+|interface:.+|host:.+)';
        @gcc = $driver->find_child_elements($grid, './/td', 'xpath');
        $is_ok &= $driver->check_sytax_grid(\@gcc, \5, \0, \@regex);

        ok($is_ok, "detail grid syntax ok");

        #####

        # Verantwortliche
        ok( $driver->find_child_element($rp, 'ownerEmails')->get_text =~
              'Verantwortliche\sf.r\sz\sguest',
            "found panel:\tresponsible email contact"
          );
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
        plan tests => 35;
        $driver->find_element('btn_search_services')->click;
        my $search_window = $driver->find_element('window_search');
        if (!ok($search_window, "found search 'window'")) {
            die("no search window -> no search");
        }
        ok($driver->find_child_element($search_window, 'txtf_search_ip1'),
            "found input field:\tip1");
        ok($driver->find_child_element($search_window, 'txtf_search_ip2'),
            "found input field:\tip2");
        ok($driver->find_child_element($search_window, 'txtf_search_proto'),
            "found input field:\tprotocol");
        ok($driver->find_child_element($search_window, 'cb_search_supernet'),
            "found checkbox:\tsearch supernet");
        ok($driver->find_child_element($search_window, 'cb_search_subnet'),
            "found checkbox:\tsearch subnet");
        ok($driver->find_child_element($search_window, 'cb_search_range'),
            "found checkbox:\tsearch port range");
        ok($driver->find_child_element($search_window, 'cb_search_own'),
            "found checkbox:\tsearch own services");
        ok($driver->find_child_element($search_window, 'cb_search_used'),
            "found checkbox:\tsearch used services");
        ok($driver->find_child_element($search_window, 'cb_search_usable'),
            "found checkbox:\tsearch usable services");
        ok($driver->find_child_element($search_window, 'cb_search_limited'),
            "found checkbox:\tsearch temporary services");
        ok($driver->find_child_element($search_window, 'cb_search_case_sensitive'),
            "found checkbox:\tsearch case sensitive");
        ok($driver->find_child_element($search_window, 'cb_search_exact'),
            "found checkbox:\tsearch exact");
        ok($driver->find_child_element($search_window, 'cb_search_keep_foreground'),
            "found checkbox:\tkeep search in foreground");
        ok($driver->find_child_element($search_window, 'btn_search_start'),
            "found button:\tstart search");

        $driver->find_child_element($search_window, 'cb_search_keep_foreground')->click;
        $driver->find_child_element($search_window, 'cb_search_used')->click;
        $driver->find_child_element($search_window, 'cb_search_subnet')->click;

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('10.2.2.2');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 4, "IP 1 = '10.2.2.2'\t=> 4 services");

        if (!ok($search_window->is_displayed, "keep search in foreground")) {
            die("search window vanished:\n$@");
        }

        $driver->find_child_element($search_window, 'cb_search_supernet')->click;
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 8,
                         "IP 1 = '10.2.2.2'\n\t& supernet\t\t=> 8 services");

        $driver->find_child_element($search_window, 'txtf_search_ip2-inputEl')
          ->send_keys('10.9.9.0');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 2,
                  "IP 1 = '10.2.2.2'\n\tIP 2 = '10.9.9.0'\n\t& supernet\t\t=> 2 services");

        $driver->find_child_element($search_window, 'txtf_search_proto-inputEl')
          ->send_keys('83');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok(
            $driver,
            1,
"IP 1 = '10.2.2.2'\n\tIP 2 = '10.9.9.0'\n\tProtokoll = 83\n\t& supernet\t\t=> 2 services"
        );

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip2-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_proto-inputEl')->clear;
        $driver->find_child_element($search_window, 'cb_search_supernet')->click;

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('sub1');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 1, "IP 1 = 'sub1'\t\t=> 1 service");

        $driver->find_child_element($search_window, 'cb_search_case_sensitive')->click;
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 0, "IP 1 = 'sub1'\n\t& case sensitive\t=> 0 service");

        # close popup
        $driver->find_child_element($driver->find_element('x-message-box', 'class'),
                                    'x-btn-button', 'class')->click;
        pass("popup closed:\t'Ihre Suche ergab keine Treffer!'");

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('Sub1');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 1, "IP 1 = 'Sub1'\n\t& case sensitive\t=> 1 service");

        $driver->find_child_element($search_window, 'cb_search_case_sensitive')->click;
        $driver->find_child_element($search_window, 'cb_search_exact')->click;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('sub1');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 0, "IP 1 = 'sub1'\n\t& exact\t\t\t=> 0 service");

        # close popup
        $driver->find_child_element($driver->find_element('x-message-box', 'class'),
                                    'x-btn-button', 'class')->click;

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('any:sub1');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 1, "IP 1 = 'any:sub1'\n\t& exact\t\t\t=> 1 service");

        $driver->find_child_element($search_window, 'btn_search_start')->click;

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('10.1.0.0/16');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 1, "IP 1 = '10.1.0.0/16'\t=> 1 service");

        $driver->find_child_element($search_window, 'cb_search_subnet')->click;
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 11,
                         "IP 1 = '10.1.0.0/16'\n\t& subnet\t\t=> 11 services");

        $driver->find_child_element($search_window, 'cb_search_subnet')->click;
        $driver->find_child_element($search_window, 'cb_search_exact')->click;

        my @search_tabs =
          $driver->find_child_elements($search_window, 'x-tab-inner', 'class');

        $search_tabs[1]->click;
        pass("switched to second search tab");

        $driver->find_element('txtf_search_string-inputEl')->send_keys('foo');
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 2,
                         "search key = 'foo'\n\t& description\t\t=> 2 elements");

        $driver->find_child_element($search_window, 'cb_search_description')->click;
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 0, "search key = 'foo'\t=> 0 elements");

        # close popup
        $driver->find_child_element($driver->find_element('x-message-box', 'class'),
                                    'x-btn-button', 'class')->click;

        $driver->find_element('txtf_search_string-inputEl')->clear;
        $driver->find_element('txtf_search_string-inputEl')->send_keys('Test9');
        $driver->find_child_element($search_window, 'cb_search_keep_foreground')->click;
        $driver->find_child_element($search_window, 'btn_search_start')->click;
        search_result_ok($driver, 1, "search key = 'Test9'\t=> 1 elements");

        ok(!$search_window->is_displayed, "search window vanished after search");

        $driver->find_element('btn_search_services')->click;
        $search_tabs[0]->click;
        pass("switched to first search tab");

        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')->clear;
        $driver->find_child_element($search_window, 'txtf_search_ip1-inputEl')
          ->send_keys('10.2.2.2');
        $driver->find_child_element($search_window, 'btn_search_start')->click;

        # filter nach Suche

        $driver->find_element('cb_show_names')->click;

        my $grid_rules = $driver->find_element('grid_rules-body');
        my @zeug  = $driver->find_child_elements($grid_rules, 'x-grid-cell', 'class');
        my $is_ok = 1;

        $is_ok &= $zeug[0]->get_text eq "permit";
        $is_ok &= $zeug[1]->get_text eq "10.2.2.2";
        $is_ok &= $zeug[2]->get_text eq "10.2.2.2";
        $is_ok &= $zeug[3]->get_text eq "udp 83";

        $driver->find_element('cb_filter_search')->click;
        @zeug = $driver->find_child_elements($grid_rules, 'x-grid-cell', 'class');

        $is_ok &= $zeug[0]->get_text eq "permit";
        $is_ok &= $zeug[1]->get_text eq "10.1.0.10\n10.2.2.2";
        $is_ok &= $zeug[2]->get_text eq "10.1.0.10\n10.2.2.2";
        $is_ok &= $zeug[3]->get_text eq "udp 83";

        ok($is_ok, "filter for search correcty");
    };
}

sub search_result_ok {
    my ($driver, $expected, $ok_text) = @_;
    eval {
        my @grid =
          $driver->find_child_elements($driver->find_element('pnl_services-body'),
                                       './/tr', 'xpath');
        ok(scalar @grid eq $expected, $ok_text);
    };
    if ($@) { die("something went wrong in 'search_result_ok':\n$@") }
}

1;
