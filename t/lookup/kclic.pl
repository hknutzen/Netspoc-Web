
# for testing test :)
# look at PolicyWeb and print id of activ elements

use lib 't';
use Selenium::Chrome;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::Frontend;
use PolicyWeb::Diff qw/setup/;

my $pid = fork();
if (0 == $pid) {
  setpgrp(0, 0);
	exec "java -jar t/selenium-server-standalone-3.141.59.jar";
  die "exec failed $!\n";
}
$pid or die "fork failed: $!\n";

my $driver = PolicyWeb::Frontend::getDriver();

$driver->get('index.html');
PolicyWeb::Diff::setup($driver);

eval {
  while (1) {
    print $driver->get_active_element()->get_attribute('id') . "\n";
    sleep 1;
  }
}
or print "whoopsi, or browser closed\n";

$driver->quit();

kill 'TERM', -$pid or die "Can't kill";

1;
