use lib 't';
use Test::Selenium::Remote::Driver;
use PolicyWeb::Init qw/$SERVER $port/;

PolicyWeb::Init::prepare_export();
PolicyWeb::Init::prepare_runtime_no_login();

my $driver = Test::Selenium::Remote::Driver->new(
    browser_name   => 'chrome',
    proxy          => { proxyType => 'direct', },
    base_url       => "http://$SERVER:$port",
    default_finder => 'id',
    javascript     => 1,
);

$driver->get('index.html');

eval { for ( ;; ) { print $driver->get_active_element()->get_attribute('id') . "\n"; sleep 1; } } 
or do { print "whoopsi, or browser closed\n"; };

$driver->quit();
