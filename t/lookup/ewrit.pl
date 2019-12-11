
# for testing test :)
# look at PolicyWeb and run perl lines

use lib 't';
use Selenium::Chrome;
use PolicyWeb::Init qw/prepare_export prepare_runtime_base $SERVER $port/;

prepare_export(0);
prepare_runtime_base(0);

my $driver =
  Selenium::Chrome->new(browser_name   => 'chrome',
                        proxy          => { proxyType => 'direct', },
                        base_url       => "http://$SERVER:$port",
                        default_finder => 'id',
                        javascript     => 1,
                       );

$driver->get('index.html');

print "Enter stuff to run as perl code\nctrl + D to exit\n>";

eval {
    my $input;
    while (chomp($input = <>)) {
        eval $input;
        if   ($@) { print "\n$@\n>"; }
        else      { print "\n>"; }
    }
};
if ($@) { print "bye bye\n"; }

$driver->shutdown_binary;
