
package PolicyWeb::Entitlement;

use strict;
use warnings;
use Test::More;

sub test {

    my $driver = shift;

    plan tests => 11;

    eval {

        $driver->find_element('btn_entitlement_tab')->click;

        my $grid =
          $driver->find_element('//div[contains(@id, "accountview")]', 'xpath');
        ok($grid, "found grid:\taccoutnview");
        $driver->find_element_ok('//span[text()="Verantwortliche"]',
                                 'xpath', "found header:\t'Verantwortliche'");

        my @check = ('guest');
        ok(check_grid($driver, $grid, \@check),
            "'Verantwortliche' grid contains guest");

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
        ok(check_grid($driver, $grid, \@check), "'Übergeordnet' grid contains x");

        $grid =
          $driver->find_element('//div[contains(@id, "supervisoremaillist")]', 'xpath');
        ok($grid, "found grid:\tsupervisoremaillist");
        $driver->find_element_ok('//span[contains(text(), "Berechtigte f")]',
                                 'xpath',
                                 "found header:\tBerechtigte für x"
                                );
        @check = ('guest');
        ok(check_grid($driver, $grid, \@check), "'Berechtigte für x' grid contains x");
    };
    if ($@) { print $@ , "\n"; }
}

sub check_grid {
  
    my ($driver, $grid, $contains) = @_;

    my @list =
      $driver->find_child_elements($grid, '//table[contains(id, gridview)]',
                                   'xpath');

    for my $name (@$contains) {
        grep { $_->get_text eq $name } @list or return 0;
    }
    return 1;
}

1;
