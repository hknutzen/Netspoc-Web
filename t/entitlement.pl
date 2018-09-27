
use strict;
use warnings;
use lib 't';
use Test::More;
use Test::Selenium::Remote::Driver;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use PolicyWeb::Entitlement;

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver =
  PolicyWeb::FrontendTest->new(browser_name   => 'chrome',
                               proxy          => { proxyType => 'direct', },
                               default_finder => 'id',
                               javascript     => 1,
                               base_url       => "http://$SERVER:$port/index.html",
                               custom_args    => '--temp-profile',
                              );

$driver->login_as_guest_and_choose_owner('x');

$driver->PolicyWeb::Entitlement::test();

done_testing;

if ($driver) { $driver->shutdown_binary; }

exit 0;
