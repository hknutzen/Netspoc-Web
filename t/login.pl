
use strict;
use warnings;
use lib 't';
use Test::More;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use PolicyWeb::Login;

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver =
  PolicyWeb::FrontendTest->new(browser_name   => 'chrome',
                               proxy          => { proxyType => 'direct', },
                               default_finder => 'id',
                               javascript     => 1,
                               base_url       => "http://$SERVER:$port",
                               custom_args    => '--temp-profile',
                              );

$driver->get('index.html');

$driver->PolicyWeb::Login::test();

done_testing();

if ($driver) { $driver->shutdown_binary; }

exit 0;
