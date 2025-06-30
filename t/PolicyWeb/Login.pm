
package PolicyWeb::Login;

use strict;
use warnings;
use Test::More;
use Selenium::Waiter qw/wait_until/;

sub test {
    my ($driver) = @_;

    plan tests => 4;

    eval {

        if ( find_login($driver) ) {

            subtest "fail to login" => sub {
                plan tests => 1;

                wait_until {
                    $driver->find_element('txtf_email')->send_keys('not_guest')
                };

                $driver->find_element('btn_login')->click;

                ok( $driver->get_current_url() =~ /backend6\/login/,
                    "login as not_guest failed" );
            };

            subtest "login as guest" => sub {
                plan tests => 1;

                $driver->get('index.html');

                wait_until {
                    $driver->find_element('txtf_email')->send_keys('guest')
                };

                wait_until { $driver->find_element('btn_login')->click };

                ok( $driver->get_current_url() =~ /app.html/,
                    "login as guest" );
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
    my ($driver) = @_;

    my ( $a, $b, $c );

    subtest "login elements" => sub {
        plan tests => 3;

        ok( $a = wait_until { $driver->find_element('txtf_email') },
            "found input box:\temail" );
        ok( $b = wait_until { $driver->find_element('txtf_password') },
            "found input box:\tpassword" );
        ok( $c = wait_until { $driver->find_element('btn_login') },
            "found button:\tlogin" );
    };
    return $a && $b && $c;
}

sub find_top_buttons {
    my ($driver) = @_;

    subtest "top elements" => sub {
        plan tests => 11;

        ok( wait_until { $driver->find_element('btn_services_tab') },
            "found button:\tservices tab" );

        ok( wait_until { $driver->find_element('btn_own_networks_tab') },
            "found button:\town networks tab" );

        ok( wait_until { $driver->find_element('btn_diff_tab') },
            "found button:\tdiff tab" );

        ok( wait_until { $driver->find_element('btn_entitlement_tab') },
            "found button:\tentitlement tab" );

        ok(
            wait_until {
                $driver->find_element( '//div[text()="Stand"]', 'xpath' )
            },
            "found text:\t'Stand'"
        );

        ok( wait_until { $driver->find_element('list_history') },
            "found combo:\thistory" );

        ok(
            wait_until {
                $driver->find_element( '//div[text()="Verantwortungsbereich"]',
                    'xpath' )
            },
            "found text:\t'Verantwortungsbereich'"
        );
        ok( wait_until { $driver->find_element('list_owner') },
            "found combo:\towner" );

        ok(
            wait_until {
                $driver->find_element( '//div[text()="Abmelden"]', 'xpath' )
            },
            "found text:\t'Abmelden'"
        );

        ok( wait_until { $driver->find_element('btn_logout') },
            "found button:\tlogout" );

        ok( wait_until { $driver->find_element('btn_info') },
            "found button:\tinfo" );
    };
}

1;
