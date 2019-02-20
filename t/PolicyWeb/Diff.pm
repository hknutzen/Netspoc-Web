
package PolicyWeb::Diff;

use strict;
use warnings;
use Test::More;
use PolicyWeb::CleanupDaily;
use Selenium::Waiter qw/wait_until/;

sub test {

    my $driver = shift;

    plan tests => 2;

    eval {
        $driver->set_implicit_wait_timeout(200);
        setup($driver);

        services($driver);

        diff($driver);

        # other test work with the old policy
        fallback($driver);
    };
    if ($@) { print $@ , "\n"; }
}

sub services {

    my $driver = shift;

    subtest "check services with diffrent policies" => sub {

        plan tests => 4;

        wait_until { $driver->find_element('btn_services_tab')->click };
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
        ok($find_Test11,  "found service:\tTest11");
        ok($find_Test12,  "found service:\tTest12");

        # changed Protokoll tcp 84 -> tcp 83
        $find_Test11->click;
        my $rp      = $driver->find_element('pnl_service_details');
        my @details = $driver->find_child_elements($rp, 'x-grid-cell', 'class');
        ok($details[3]->get_text eq "tcp 83", "changed protokoll of Test11");
    };
}

sub diff {

    my $driver = shift;

    subtest "check diff" => sub {

        plan tests => 6;

        $driver->find_element('btn_diff_tab')->click;

        my $pnl_diff = $driver->find_element('pnl_diff');

        ok(
            $driver->find_child_element($pnl_diff, '//div[text()="Vergleiche mit"]', 'xpath'
                                       ),
            "found text:\t'Vergleiche mit'"
          );

        my $combo = $driver->find_child_element($pnl_diff, 'list_diff_policies');
        ok($combo, "found combo:\tolder policies");

        ok($driver->find_child_element($pnl_diff, 'btn_diff_tooltip'),
            "found button:\ttooltip");

        ok($driver->find_child_element($pnl_diff, 'x-form-checkbox', 'class'),
            "found checkbox:\tsend diffs per mail");

        my $pnl_tree = $driver->find_child_element($pnl_diff, 'x-panel-body', 'class');

        my @tree = $driver->find_child_elements($pnl_tree, './/tr', 'xpath');

        ok( scalar @tree == 1
              && $tree[0]->get_text =~ /Bitte Stand ausw.hlen in "Vergleiche mit"./,
            "no tree without choosen policy"
          );

        # select old policy to get diff
        $combo->click;
        my @boundlists = $driver->find_elements('x-boundlist', 'class');
        my @histories;
        for (my $i = 0 ; $i < @boundlists ; $i++) {
            if ($boundlists[$i]->get_text) {
                @histories =
                  $driver->find_child_elements($boundlists[$i], 'x-boundlist-item', 'class');
            }
        }
        wait_until { $histories[0]->click };

        # tree needs to be loaded
        sleep 1;
        @tree = $driver->find_child_elements($pnl_tree, './/tr', 'xpath');

        my $check = 1;
        $check &= $tree[0]->get_text eq "Unterschiede";
        $check &= $tree[1]->get_text eq "Dienste";
        $check &= $tree[2]->get_text eq "Test11";
        $check &= $tree[3]->get_text eq "rules";
        $check &= $tree[4]->get_text eq "1";
        $check &= $tree[5]->get_text eq "prt";
        $check &= (
               $driver->find_child_element($tree[6], './/img[contains(@class, "icon-add")]',
                                           'xpath'
                 ) ? 1 : 0
        );
        $check &= $tree[7]->get_text eq "tcp 83";
        $check &= (
            $driver->find_child_element($tree[8], './/img[contains(@class, "icon-delete")]',
                                        'xpath'
              ) ? 1 : 0
        );
        $check &= $tree[9]->get_text eq "tcp 84";
        $check &= $tree[10]->get_text eq "Liste eigener Dienste";
        $check &= (
            $driver->find_child_element($tree[11],
                                        './/img[contains(@class, "icon-page_edit")]', 'xpath')
            ? 1
            : 0
        );
        $check &= $tree[12]->get_text eq "Test11";
        $check &= (
              $driver->find_child_element($tree[13], './/img[contains(@class, "icon-add")]',
                                          'xpath'
                ) ? 1 : 0
        );
        $check &= $tree[14]->get_text eq "Test12";
        $check &= (
            $driver->find_child_element($tree[15], './/img[contains(@class, "icon-delete")]',
                                        'xpath'
              ) ? 1 : 0
        );
        $check &= $tree[16]->get_text eq "Test10";
        ok($check, "diff tree contains all information");
    };
}

sub setup {

    my $driver = shift;

    my $export_dir = $driver->get_export_dir();
    my $home_dir   = $driver->get_home_dir();

    local $ENV{HOME} = $home_dir;

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

    $driver->find_element('list_history')->click;

    my @boundlists = $driver->find_elements('x-boundlist', 'class');
    my @histories;
    for (my $i = 0 ; $i < @boundlists ; $i++) {
        if ($boundlists[$i]->get_text) {
            @histories =
              $driver->find_child_elements($boundlists[$i], 'x-boundlist-item', 'class');
        }
    }

    # choose oldest policy
    $histories[-1]->click;
}

1;
