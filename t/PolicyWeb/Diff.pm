
package PolicyWeb::Diff;

use strict;
use warnings;
use Test::More;
use PolicyWeb::CleanupDaily;

sub test {

    my $driver = shift;

    plan tests => 2;

    eval {
        setup($driver);

        services($driver);

        diff($driver);

        # other test work with the old policy
        fallback($driver);
        # sleep 1000;
    };
    if ($@) { print $@ , "\n"; }
}

sub services {

    my $driver = shift;

    subtest "check services with diffrent policies" => sub {

        plan tests => 4;

        $driver->find_element('btn_services_tab')->click;
        $driver->find_element('btn_own_services')->click;

        my $lp = $driver->find_element('pnl_services');

        my @grid = $driver->find_child_elements($lp, './/td', 'xpath');

        my $find_Test10;
        my $find_Test11;
        my $find_Test12;
        
        for (my $i = 0 ; $i < @grid ; $i++) {
            if ($grid[$i]->get_text eq "Test10") {
                $find_Test10 = $grid[$i];
            }
            elsif ($grid[$i]->get_text eq "Test11") {
                $find_Test11 = $grid[$i];
            }
            elsif ($grid[$i]->get_text eq "Test12") {
                $find_Test12 = $grid[$i];
            }
        }
        
        ok(!$find_Test10, "Test10 removed");
        ok($find_Test11, "found service:\tTest11");
        ok($find_Test12, "found service:\tTest12");

        # changed Protokoll tcp 84 -> tcp 83
        $find_Test11->click;
        my $rp = $driver->find_element('pnl_service_details');
        my @details = $driver->find_child_elements($rp, 'x-grid-cell', 'class');
        ok($details[3]->get_text eq "tcp 83", "changed protokoll of Test11");
    };
}

sub diff {

    my $driver = shift;

    subtest "check diff" => sub {

        #plan tests => todo;

        $driver->find_element('btn_diff_tab')->click;

        my $pnl = $driver->find_element('pnl_diff');

        my $combo = $driver->find_child_element($pnl, 'list_diff_policies');
        $combo->click;


        my @boundlists = $driver->find_elements('x-boundlist', 'class');
        my @histories;
        for (my $i = 0; $i < @boundlists; $i++) {
            print $boundlists[$i]->get_text, "\n";
            if ($boundlists[$i]->get_text) {
                @histories = $driver->find_child_elements($boundlists[$i], 'x-boundlist-item', 'class');
            }
        }

        $histories[0]->click;

        my $pnl_diff;

        ok(1, "okay");

        sleep 4;
    };
}

sub setup {

    my $driver = shift;

    my $export_dir = $driver->get_export_dir();
    my $home_dir   = $driver->get_home_dir();

    make_visible($home_dir, 'bin');
    make_visible($home_dir, 'mail');

    # Create users directory
    # - to calm down del_obsolete_users.pl and
    # - to store attribute 'send_diff'
    mkdir "$home_dir/users" or die $!;

    # set timestamps to last day
    my $timestamp = time() - 60 * 60 * 24;
    set_timestamp_of_files($driver->get_export_dir, $timestamp);

    my $mail = cleanup_daily();

    # changes to the policy
    my $netspoc = $driver->get_netspoc;
    $netspoc =~ s/\nservice:Test10(.+\n)*\}\n//g;
    $netspoc =~
s/service:Test11(.+\n)*\}\n/service:Test11 = {\n user = network:Sub;\n permit src = user; dst = network:KUNDE1; prt = tcp 83;\n}/g;
    $netspoc = $netspoc
      . "\nservice:Test12 = {\n user = network:Sub;\n permit src = user; dst = network:KUNDE1; prt = tcp 83;\n}";

    # new policy is from the actuall time
    $timestamp = time();
    my $policy_num = 2;
    export_netspoc($netspoc, $export_dir, $policy_num++, $timestamp);

    $mail = cleanup_daily();

    $driver->refresh();
}

sub fallback {
    my $driver = shift;

    my $history = $driver->find_element('list_history');
}

1;
