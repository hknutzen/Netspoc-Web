
use strict;
use warnings;
use lib 't';
use Test::More;    # tests => 28;
use Test::Selenium::Remote::Driver;
use Selenium::Remote::WebElement;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::FrontendTest;
use PolicyWeb::OwnNetworks;

##############################################################################
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
##############################################################################

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver =
  PolicyWeb::FrontendTest->new(browser_name       => 'chrome',
                               proxy              => { proxyType => 'direct', },
                               default_finder     => 'id',
                               javascript         => 1,
                               extra_capabilities => { nativeEvents => 'false' },
                              );

$driver->set_implicit_wait_timeout(200);
$driver->login_as_guest_and_choose_owner('x');

$driver->PolicyWeb::OwnNetworks::test();

done_testing;

if ($driver) { $driver->shutdown_binary; }

exit 0;
