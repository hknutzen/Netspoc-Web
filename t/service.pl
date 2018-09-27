
use strict;
use warnings;
use lib 't';
use Test::More;    # tests => 60;
use Selenium::Remote::WDKeys;
use PolicyWeb::Init;
use PolicyWeb::FrontendTest;
use PolicyWeb::Service;

my $driver =
  PolicyWeb::FrontendTest->new(browser_name   => 'chrome',
                               proxy          => { proxyType => 'direct', },
                               default_finder => 'id',
                               javascript     => 1,
                               custom_args    => '--temp-profile',
                              );

prepare_export();
prepare_runtime();

$driver->set_implicit_wait_timeout(200);

$driver->login_as_guest_and_choose_owner('x');

$driver->PolicyWeb::Service::test();

done_testing();

if ($driver) { $driver->shutdown_binary; }

exit 0;
