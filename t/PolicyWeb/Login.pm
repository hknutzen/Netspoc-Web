
package PolicyWeb::Login;

use strict;
use warnings;
use Test::More;

####################################################################
#
# Test description:
# -----------------
#
# - go to tab "Eigene Netze"
# - check buttons and grid header beeing present
# - check sytax of grids
#   - check correct resources are displayed after selecting networks
# - check selection and cancel mechanic is functioning properly
#           button changes and
#           services are correctly displayed in services tab
#
####################################################################

sub test {

    my $driver = shift;

    plan tests => 5;

    eval {

        if (find_login($driver)) {

            subtest fail_to_login => sub {
                plan tests => 1;

                $driver->send_keys_to_active_element('not_guest');

                $driver->find_element('btn_login')->click;

                ok($driver->get_current_url() =~ /backend\/login/, "login as not_guest failed");
            };

            subtest login_as_guest => sub {
                plan tests => 1;

                $driver->get('index.html');

                $driver->send_keys_to_active_element('guest');

                $driver->find_element('btn_login')->click;

                ok($driver->get_current_url() =~ /app.html/, "login as guest");
            };

            subtest "choose owner" => sub {
                plan tests => 1;

                my $owner = 'x';

                $driver->PolicyWeb::FrontendTest::choose_owner($owner);

                pass("owner $owner selected");
            };

            find_top_buttons($driver);
        }
    };

    if ($@) {
        print "$@\n";
        return 0;
    }
    return 1;
}

# checks if elements needed to login are present.
# return 1, if true.
sub find_login {

    my $driver = shift;

    my ($a, $b, $c);

    subtest login_elements => sub {
        plan tests => 3;

        ok($a = $driver->find_element('txtf_email'), "found input box:\temail");

        ok($b = $driver->find_element('txtf_password'), "found input box:\tpassword");

        ok($c = $driver->find_element('btn_login'), "found button:\tlogin");
    };
    return $a && $b && $c;
}

sub find_top_buttons {

    my $driver = shift;

    #my ($a, $b, $c, $d, $e);
    subtest top_elements => sub {
        plan tests => 5;

        ok($driver->find_element('btn_services_tab'), "found button:\tservices tab");

        ok($driver->find_element('btn_own_networks_tab'),
            "found button:\town networks tab");

        ok($driver->find_element('btn_diff_tab'), "found button:\tdiff tab");

        ok($driver->find_element('btn_entitlement_tab'),
            "found button:\tentitlement tab");

        ok($driver->find_element('//div[text()="Stand"]', 'xpath'),
            "found text:\t'Stand'");

        # historycombo...
        # -> button zum auswaehlen usw
        # "Verantwortungsbereich"
        # ownercombo
        # "Abmelden"
    };
}

1;
