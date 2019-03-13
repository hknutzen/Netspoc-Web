
package PolicyWeb::OwnNetworks;

use strict;
use warnings;
use Test::More;

sub test {

    my $driver = shift;

    plan tests => 4;

    eval {

        $driver->find_element('btn_own_networks_tab')->click;

        test_own_networks_grid($driver);

        my @networks_grid_cells =
          $driver->find_child_elements($driver->find_element('grid_own_networks'),
                                       'x-grid-cell', 'class');

        test_resources_grid($driver, \@networks_grid_cells);

        test_print($driver, \@networks_grid_cells);

        test_selection_and_services($driver, \@networks_grid_cells);

    };
    if ($@) { print $@ , "\n"; }
}

sub test_own_networks_grid {

    my $driver            = shift;
    my $own_networks_grid = $driver->find_element('grid_own_networks');

    subtest "own networks grid" => sub {
        plan tests => 7;

        $driver->find_element_ok('//div[text()="Netzauswahl"]', 'xpath',
                                 "found text:\t'Netzauswahl'");
        $driver->find_element_ok('btn_confirm_network_selection',
                                 "found button:\tconfirm selection");
        $driver->find_element_ok('btn_cancel_network_selection',
                                 "found button:\tcancel selection");

        if (!ok($own_networks_grid, "found grid:\tnetwork")) {
            die("network grid is missing");
        }

        my @networks_grid_cells =
          $driver->find_child_elements($own_networks_grid, 'x-grid-cell', 'class');

        # check form
        my @regex = ('(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)',
                     '(network)|(interface):\.*', 'x|y|z'
                    );

        ok($driver->check_sytax_grid(\@networks_grid_cells, \4, \1, \@regex),
            "own networks grid looks fine");

        # find grid head
        my @grid_heads =
          $driver->find_child_elements($own_networks_grid, 'x-column-header', 'class');

        if (!ok(@grid_heads, "found header:\tleft grid")) {
            die("no headers found for own networks grid");
        }

        ok( $driver->is_order_after_change(\$own_networks_grid, \4, \1, \@grid_heads, \0),
            "own networks grid order changes");

        # back to standart
        $grid_heads[1]->click;

    };
}

sub test_resources_grid {

    my $driver              = shift;
    my @networks_grid_cells = @{ (shift) };

    subtest "resources grid" => sub {
        plan tests => 12;

        $driver->find_element_ok('//div[text()="Enthaltene Ressourcen"]',
                                 'xpath',
                                 "found text:\t'Enthaltene Ressourcen'"
                                );

        my $resources_grid = $driver->find_element('grid_network_resources');

        ok($resources_grid, "found grid:\tnetworkresources");

        my @grid_head_right =
          $driver->find_child_elements($resources_grid, 'x-column-header', 'class');
        ok(@grid_head_right, "found header:\tright grid");

        # grid should be empty, if no own network is selected
        my @resources_grid_cells =
          $driver->find_child_elements($resources_grid, 'x-grid-cell', 'class');
        ok(!@resources_grid_cells, "no networkresources, if no network is selected");

        # select network 'Big' and 'Kunde'
        $driver->select_by_key(\@networks_grid_cells, 4, 2, "network:Big");

        ok($driver->find_element('x-grid-group-hd', 'class')->get_text =~ /network:Big/,
            "found group:\tnetwork:Big");

        my @names = ('host:B10', 'host:Range', 'interface:asa.Big', 'interface:u.Big');
        ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
            "networkresources for network:Big");

        $grid_head_right[1]->click;

        ok( $driver->is_order_after_change(\$resources_grid, \3, \0, \@grid_head_right, \1),
            "resources grid order changes");

        $driver->select_by_key(\@networks_grid_cells, 4, 2, "network:Kunde");

        ok($driver->find_element('x-grid-group-hd', 'class')->get_text =~ /network:Big/,
            "found group:\tnetwork:Kunde");

        # grid should now contain more
        push(@names, ('host:k', 'interface:asa.Kunde'));

        ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
            "networkresources for network:Big and network:Kunde");

        # for checking correct syntax
        my @res_reg = ('(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)',
                       '(host)|(interface):\.*', 'x|y|z|'
                      );

        # reload grid
        @resources_grid_cells =
          $driver->find_child_elements($resources_grid, 'x-grid-cell', 'class');
        ok($driver->check_sytax_grid(\@resources_grid_cells, \3, \0, \@res_reg),
            "resources grids looks fine");

        $driver->find_child_element($resources_grid,
                                    '//div[contains(@data-groupname, "network:Big")]', 'xpath')->click;

        # grid should now contain less
        @names = ('host:k', 'interface:asa.Kunde');

        ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
            "networkresources while network:Big is collapsed");

        $driver->find_element('btn_cancel_network_selection')->click;

        ok($driver->find_child_elements($resources_grid, 'x-grid-cell', 'class'),
            "network selection canceled");
    };
}

sub test_selection_and_services {

    my $driver              = shift;
    my @networks_grid_cells = @{ (shift) };

    subtest "selection and services" => sub {
        plan tests => 4;
        my $bont_b =
              $driver->find_element('btn_own_networks_tab')->get_text =~ "Eigene Netze"
          and $driver->find_element('btn_own_networks_tab')
          ->Selenium::Remote::WebElement::get_attribute('class') =~
          /icon-computer_connect/;

        #should be disabled
        my $boncc_b = $driver->find_element('btn_confirm_network_selection')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
        $boncc_b &= $driver->find_element('btn_cancel_network_selection')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;

        $driver->select_by_key(\@networks_grid_cells, 4, 2, "network:KUNDE1");

        #should be enabled
        $boncc_b &= !($driver->find_element('btn_confirm_network_selection')
                ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/);
        $boncc_b &= !($driver->find_element('btn_cancel_network_selection')
                ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/);

        $driver->find_element('btn_confirm_network_selection')->click;

        #only confirm should be disabled
        $boncc_b &= $driver->find_element('btn_confirm_network_selection')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
        $boncc_b &= !($driver->find_element('btn_cancel_network_selection')
                ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/);

        #'Eigene Netze' should've changed to 'Ausgewählte Netze'
        $bont_b &=
          $driver->find_element('btn_own_networks_tab')->get_text =~ "Ausgew.hlte Netze"
          and $driver->find_element('btn_own_networks_tab')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /icon-exclamation/;

        $driver->find_element('btn_services_tab')->click;

        $driver->find_element('btn_own_services-btnIconEl')->click;

        my @service_grid =
          $driver->find_child_elements($driver->find_element('pnl_services'),
                                       'x-grid-cell', 'class');

        ok((scalar @service_grid == 1 and $service_grid[0]->get_text eq 'Test11'),
            "found services:\tonly Test11");

        $driver->find_element('btn_own_networks_tab')->click;

        $driver->find_element('btn_cancel_network_selection')->click;

        #should return to standard
        $boncc_b &= $driver->find_element('btn_confirm_network_selection')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
        $boncc_b &= $driver->find_element('btn_cancel_network_selection')
          ->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
        $bont_b =
              $driver->find_element('btn_own_networks_tab')->get_text =~ "Eigene Netze"
          and $driver->find_element('btn_own_networks_tab')
          ->Selenium::Remote::WebElement::get_attribute('class') =~
          /icon-computer_connect/;

        ok($bont_b, "button own network tab changed name and icon correctly");
        ok($boncc_b,
            "buttons confirm and cancel network selection changed disabled status correctly"
          );

        $driver->find_element('btn_services_tab')->click;

        @service_grid =
          $driver->find_child_elements($driver->find_element('pnl_services'),
                                       'x-grid-cell', 'class');

        ok((scalar @service_grid == 12), "found services:\tall 12");

        $driver->find_element('btn_own_networks_tab')->click;
    };
}

sub test_print {

    my $driver              = shift;
    my @networks_grid_cells = @{ (shift) };

    subtest print => sub {
        plan tests => 2;

        test_print_own_networks($driver, \@networks_grid_cells);

        test_print_resources($driver, \@networks_grid_cells);

        $driver->find_element('btn_cancel_network_selection')->click;
    };
}

sub test_print_own_networks {

    my $driver              = shift;
    my @networks_grid_cells = grep { /.*\S.*/ } map { $_->get_text } @{ (shift) };

    subtest "print own networks" => sub {
        plan tests => 6;

        # go to print tab
        $driver->find_element('btn_print_own_networks')->click;
        my $handles = $driver->get_window_handles;
        $driver->switch_to_window($handles->[1]);
        ok($driver->get_title() eq "Druckansicht", "switched to a print tab");

        my $winprin = $driver->find_element('x-ux-grid-printer', 'class');

        # check for control buttons
        my @p_bnts =
          $driver->find_child_elements(
                                       $driver->find_child_element(
                                                  $winprin, 'x-ux-grid-printer-noprint', 'class'
                                                                  ),
                                       '//a', 'xpath'
                                      );
        ok($p_bnts[0]->get_text eq 'Drucken', "found button:\t'Drucken'");
        ok($p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'");

        # compare
        my @print_head =
          map { $_->get_text } $driver->find_child_elements($winprin, './/th', 'xpath');
        ok( $print_head[0] eq "IP-Adresse" & $print_head[1] eq "Name" &
              $print_head[2] eq "Verantwortungsbereich",
            "print grid header are correct"
          );

        my @print_cells =
          map { $_->get_text } $driver->find_child_elements($winprin, './/td', 'xpath');
        ok($driver->comp_array(\@networks_grid_cells, \@print_cells),
            "print contains same grid");

        # close print tab and go back
        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok(scalar @{$handles} == 1, "button clicked:\t'Schließen'");
        $driver->switch_to_window($handles->[0]);
    };
}

sub test_print_resources {

    my $driver              = shift;
    my @networks_grid_cells = @{ (shift) };

    subtest "print resources" => sub {
        plan tests => 6;

        # select networks
        $driver->select_by_key(\@networks_grid_cells, 4, 2, "network:Big");
        $driver->select_by_key(\@networks_grid_cells, 4, 2, "network:Kunde");

        # collect resources data
        my $res_panel  = $driver->find_element('grid_network_resources');
        my @res_header = map { $_->get_text }
          $driver->find_child_elements($res_panel, 'x-column-header', 'class');
        my @res_grid = map { $_->get_text }
          $driver->find_child_elements(
            $res_panel,
'.//*[contains(@class, "x-grid-group-title") or contains(@class, "x-grid-row")]',
            'xpath'
          );

        # go to print tab
        $driver->find_element('btn_print_network_resources')->click;
        my $handles = $driver->get_window_handles;
        $driver->switch_to_window($handles->[1]);
        ok($driver->get_title() eq "Druckansicht", "switched to a print tab");

        my $winprin = $driver->find_element('x-ux-grid-printer', 'class');

        # check for control buttons
        my @p_bnts =
          $driver->find_child_elements(
                                       $driver->find_child_element(
                                                  $winprin, 'x-ux-grid-printer-noprint', 'class'
                                                                  ),
                                       '//a', 'xpath'
                                      );
        ok($p_bnts[0]->get_text eq 'Drucken', "found button:\t'Drucken'");
        ok($p_bnts[1]->get_text =~ /Schlie.en/, "found button:\t'Schließen'");

        # compare headers
        my @print_head =
          map { $_->get_text } $driver->find_child_elements($winprin, './/th', 'xpath');
        my $is_ok = 1;
        for (my $i = 1 ; $i < @res_header ; $i++) {

            # $i starts at 1 because the first resources header is for some reason empty
            if ($res_header[$i] ne $print_head[ $i - 1 ]) {
                $is_ok = 0;
                print "at $i: $res_header[$i] ne $print_head[$i-1]\n";
                last;
            }
        }
        ok($is_ok, "print grid header are correct");

        # collect print grid
        my @print_grid =
          $driver->find_child_elements(
            $winprin,
'.//*[contains(@class, "group-header") or contains(@class, "odd") or contains(@class, "even")]',
            'xpath'
          );
        shift @print_grid;

        # compare grids
        $is_ok = scalar @res_grid eq scalar @print_grid;
        for (my $i = 0 ; $i < @print_grid ; $i++) {
            if ($res_grid[$i] ne $print_grid[$i]->get_text) {
                $is_ok = 0;
                print "at $i: $res_grid[$i] ne ", $print_grid[$i]->get_text, "\n";
            }
        }
        ok($is_ok, "print contains same grid");

        # close print tab and go back
        $p_bnts[1]->click;
        $handles = $driver->get_window_handles;
        ok(scalar @{$handles} == 1, "button clicked:\t'Schließen'");
        $driver->switch_to_window($handles->[0]);
    };
}

1;
