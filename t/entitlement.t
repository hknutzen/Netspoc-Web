
use strict;
use warnings;

use lib 't';
use Test::More;

#use Selenium::Remote::Driver;
#use Selenium::Remote::WebElement;
#use Selenium::Waiter;
use Test::Selenium::Remote::Driver;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;

#use Data::Dumper;
#use Try::Tiny;

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver =
  PolicyWeb::FrontendTest->new(browser_name   => 'chrome',
                               proxy          => { proxyType => 'direct', },
                               default_finder => 'id',
                               javascript     => 1,
                               base_url       => "http://$SERVER:$port/index.html",
                               extra_capabilities => { nativeEvents => 'false' }
                              );
eval {

    $driver->login_as_guest_and_choose_owner('x');

    $driver->find_element_ok('btn_entitlement_tab',
                             "found button:\tentitlement tab");

    $driver->find_element('btn_entitlement_tab')->click;

    my $grid =
      $driver->find_element('//div[contains(@id, "accountview")]', 'xpath');
    ok($grid, "found grid:\taccoutnview");
    $driver->find_element_ok('//span[text()="Verantwortliche"]',
                             'xpath', "found header:\t'Verantwortliche'");
    my @check = ('guest');
    ok(check_grid(\$grid, \@check), "'Verantwortliche' grid contains guest");

    $grid = $driver->find_element('//div[contains(@id, "watcherlist")]', 'xpath');
    ok($grid, "found grid:\twatcherlist");
    $driver->find_element_ok('//span[text()="Zuschauer (Watcher)"]',
                             'xpath',
                             "found header:\t'Zuschauer (Watcher)'"
                            );

    #grid is empty

    $grid =
      $driver->find_element('//div[contains(@id, "supervisorlist")]', 'xpath');
    ok($grid, "found grid:\tsupervisorlist");
    $driver->find_element_ok('//span[contains(text(),"bergeordnet")]',
                             'xpath', "found header:\t'Übergeordnet'");
    @check = ('x');
    ok(check_grid(\$grid, \@check), "'Übergeordnet' grid contains x");

    $grid =
      $driver->find_element('//div[contains(@id, "supervisoremaillist")]', 'xpath');
    ok($grid, "found grid:\tsupervisoremaillist");
    $driver->find_element_ok('//span[contains(text(), "Berechtigte f")]',
                             'xpath',
                             "found header:\tBerechtigte für x"
                            );
    @check = ('guest');
    ok(check_grid(\$grid, \@check), "'Berechtigte für x' grid contains x");

    done_testing();
};

if ($@) { print $@ , "\n"; }

$driver->quit();

sub check_grid {
    my $grid     = ${ (shift) };
    my @contains = @{ (shift) };

    my @list = $driver->find_child_elements(
                                            $driver->find_element(
                                                      '//div[contains(@id, "accountview")]',
                                                      'xpath'
                                            ),
                                            '//table[contains(id, gridview)]',
                                            'xpath'
                                           );
    for (my $i = 0 ; $i < @contains ; $i++) {
        my $check = grep { $_->get_text eq $contains[$i] } @list;
        if (!$check) {
            return 0;
        }
    }
    return 1;
}
