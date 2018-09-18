
use strict;
use warnings;
use lib 't';
use Test::More; # tests => 28;
use Test::Selenium::Remote::Driver;
use Selenium::Remote::WebElement;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;

#use Selenium::Remote::Driver;
#use Selenium::ActionChains;
#use Selenium::Waiter;
#use Data::Dumper;
#use Try::Tiny;

##############################################################################
#
# Test description:
# -----------------
#
# - go to tab "Eigene Netze"
# - check buttons and grid header beeing present
# - check sytax of grids
#	- check correct resources are displayed after selecting networks
# - check selection and cancel mechanic is functioning properly
#			button changes and
#			services are correctly displayed in services tab
#
##############################################################################

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver =
		PolicyWeb::FrontendTest->new(
														browser_name   => 'chrome',
														proxy          => { proxyType => 'direct', },
														default_finder => 'id',
														javascript     => 1,
														extra_capabilities => { nativeEvents => 'false' },
		);

$driver->set_implicit_wait_timeout(200);
$driver->login_as_guest_and_choose_owner('x');

eval{
	
	$driver->find_element('btn_own_networks_tab')->click;
	
	$driver->find_element_ok(
		'//div[text()="Netzauswahl"]', 'xpath',
		"found text:\t'Netzauswahl'"
	);
	$driver->find_element_ok(
		'btn_confirm_network_selection',
		"found button:\tconfirm selection"
	);
	$driver->find_element_ok(
		'btn_cancel_network_selection',
		"found button:\tcancel selection"
	);
	
	# test own networks grid	
	my @grid_cells = test_own_networks_grid();

###############	
	
	$driver->find_element_ok(
		'//div[text()="Enthaltene Ressourcen"]', 'xpath',
		"found text:\t'Enthaltene Ressourcen'"
	);

	my $resources_grid = $driver->find_element('grid_network_resources');

	ok($resources_grid, "found grid:\tnetworkresources");

	my @grid_head_right = $driver->find_child_elements($resources_grid,
																										'x-column-header', 'class');
	ok(@grid_head_right, "found header:\tright grid");
	
	# grid should be empty, if no own network is selected
	my @resources_grid
			= $driver->find_child_elements($resources_grid, 'x-grid-cell', 'class');
	ok(!@resources_grid, "no networkresources, if no network is selected");
	
	# select network 'Big' and 'Kunde'
	$driver->select_by_name(\@grid_cells, \4, \2, \"network:Big");
	
	ok($driver->find_element('x-grid-group-hd', 'class')->get_text
				 =~ /network:Big/,
		 "found group:\tnetwork:Big"
	);
	
	my @names
			= ('host:B10', 'host:Range', 'interface:asa.Big', 'interface:u.Big');
	ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
		 "networkresources are corret for network:Big");
	
	$grid_head_right[1]->click;
	
	ok($driver->is_order_after_change(\$resources_grid, \3, \0, \@grid_head_right, \1),
		 "resources grid order changes correctly");
	
	$driver->select_by_name(\@grid_cells, \4, \2, \"network:Kunde");
	
	ok($driver->find_element('x-grid-group-hd', 'class')->get_text
				 =~ /network:Big/,
		 "found group:\tnetwork:Kunde"
	);
	
	# grid should now contain more
	push(@names, ('host:k', 'interface:asa.Kunde'));
	
	ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
		 "networkresources are corret for network:Big and network:Kunde");
	
	# for checking correct syntax
	my @res_reg = (
					 '(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)',
					 '(host)|(interface):\.*', 'x|y|z|'
	);
	
	# reload grid
	@resources_grid
			= $driver->find_child_elements($resources_grid, 'x-grid-cell', 'class');
	ok($driver->check_sytax_grid(\@resources_grid, \3, \0, \@res_reg),
		 "resources grids looks fine");
	
	$driver->find_child_element($resources_grid, '//div[contains(@id, "network:Big")]',
															'xpath')->click;
	
	# grid should now contain less
	@names = ('host:k', 'interface:asa.Kunde');
	
	ok($driver->grid_contains(\$resources_grid, \3, \1, \@names),
		 "networkresources are corret while network:Big is collapsed");
	
	$driver->find_element('btn_cancel_network_selection')->click;
	
	ok($driver->find_child_elements($resources_grid, 'x-grid-cell', 'class'),
		 "network selection canceled");
	
	my $bont_b
			= $driver->find_element('btn_own_networks_tab')->get_text
			=~ "Eigene Netze"
			and $driver->find_element('btn_own_networks_tab')
			->Selenium::Remote::WebElement::get_attribute('class')
			=~ /icon-computer_connect/;
	
	#should be disabled
	my $boncc_b = $driver->find_element('btn_confirm_network_selection')
			->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
	$boncc_b &= $driver->find_element('btn_cancel_network_selection')
			->Selenium::Remote::WebElement::get_attribute('class') =~ /x-disabled/;
	
	$driver->select_by_name(\@grid_cells, \4, \2, \"network:KUNDE1");
	
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
	$bont_b
			&= $driver->find_element('btn_own_networks_tab')->get_text
			=~ "Ausgew.hlte Netze"
			and $driver->find_element('btn_own_networks_tab')
			->Selenium::Remote::WebElement::get_attribute('class')
			=~ /icon-exclamation/;
	
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
	$bont_b
			= $driver->find_element('btn_own_networks_tab')->get_text
			=~ "Eigene Netze"
			and $driver->find_element('btn_own_networks_tab')
			->Selenium::Remote::WebElement::get_attribute('class')
			=~ /icon-computer_connect/;
	
	ok($bont_b, "button own network tab changed name and icon correctly");
	ok(
		$boncc_b,
		"buttons confirm and cancel network selection changed disabled status correctly"
	);
	
	$driver->find_element('btn_services_tab')->click;
	
	@service_grid =
			$driver->find_child_elements($driver->find_element('pnl_services'),
																	 'x-grid-cell', 'class');
	
	ok((scalar @service_grid == 12), "found services:\tall 12");
	
	#$driver->move_to_element($driver->find_element('//*[@id="gridcolumn-1071-triggerEl"]', 'xpath'));
	#sleep 5;
	#$driver->click_element_ok('//*[@id="gridcolumn-1071-triggerEl"]', 'class', 'ok');
	#sleep 10;
	
	#for (my $i = 0; $i < @resources_grid; $i++) {
	#	print "res($i): " . $resources_grid[$i]->get_text . "\n";
	#}
	
	done_testing();
};

if ($@){print $@ . "\n";}

$driver->quit();



sub test_own_networks_grid{
	
	my $own_networks_grid = $driver->find_element('grid_own_networks');

	if(!ok($own_networks_grid, "found grid:\tnetwork")){ die("network grid is missing"); }
	
	my @grid_cells = $driver->find_child_elements($own_networks_grid, 'x-grid-cell', 'class');
	
	# check form
	my @regex = (
		'(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)\.(1\d\d|\d\d|\d)',
		'(network)|(interface):\.*', 'x|y|z'
	);
	
	ok($driver->check_sytax_grid(\@grid_cells, \4, \1, \@regex),
		 "own networks grid looks fine");
	
	# find grid head
	my @grid_heads = $driver->find_child_elements($own_networks_grid,
																										'x-column-header', 'class');
	
	
	if( !ok(@grid_heads,  "found header:\tleft grid") ) { die("no headers found for own networks grid"); }
	
	ok($driver->is_order_after_change(\$own_networks_grid, \4, \1, \@grid_heads, \0),
		 "own networks grid order changes correctly");
	
	# back to standart
	$grid_heads[1]->click;
	
	return $driver->find_child_elements($own_networks_grid, 'x-grid-cell', 'class');
}





