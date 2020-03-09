
# for testing test
# used to look at PolicyWeb and print id of activ elements
# very broken right now, produces unkillable zombie processes
# have fun :)

use warnings;
use strict;

use lib 't';
use Selenium::Chrome;
use PolicyWeb::Init qw/$SERVER $port/;
use PolicyWeb::Frontend;
use PolicyWeb::Diff qw/setup/;
use POSIX qw(:sys_wait_h);

$SIG{INT}  = \&termall;
$SIG{TERM} = \&termall;

my $driver;

my $pid = $$;

print "pid : $pid\n";

# experimental
my $cpid = fork();

if (0 == $cpid) {
	setpgrp(0,0);
	exec "xterm -e 'java -jar t/selenium-server-standalone-3.141.59.jar'";
	die "exec failed $!\n";
} else {	
	sleep 10;
	$driver = PolicyWeb::Frontend::getDriver();
	$driver->get('index.html');
	PolicyWeb::Diff::setup($driver);
	
	eval {
		while (1) {
			# standalone server cannot get an active element
			# print $driver->get_active_element()->get_attribute('id') . "\n";
			sleep 1;
		}
	}
	or print "whoopsi, or browser closed\n\n$@\n";
	
	termall();
}

sub termall {
	if ($driver) { $driver->quit(); }
	
	print "\n" . `ps -ef | grep -v grep | grep $cpid`;
	if ( ! (waitpid($cpid, WNOHANG)) ) {
		print "killing from [$$]\n";
		print "killing $cpid...\n";
		kill -9, $cpid or die "Can't kill child\n";
		print "killing ", $$, "\n";
		kill -9, $pid or die "Can't kill self\n";
	}	
}

1;
