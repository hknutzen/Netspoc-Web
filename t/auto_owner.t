#!perl

use strict;
use warnings;
use Test::More;
use lib 't';

use PolicyWeb::Init qw/ prepare_export /;
use PolicyWeb::Backend
    qw/prepare_runtime test_run extract_names extract_records/;

############################################################
# Netspoc configuration
############################################################
my $netspoc = <<'END';
owner:o1 = { admins = guest; }
owner:o2 = { admins = guest; }
owner:o3 = { admins = guest; }

network:n1 = { ip = 10.1.1.0/24; owner = o1; }
network:n2 = { ip = 10.1.2.0/24; owner = o2; }
network:n3 = { ip = 10.1.3.0/24; owner = o3; }

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
 interface:n3 = { ip = 10.1.3.1; hardware = n3; }
}

service:s1 = {
 user = network:n2;
 permit src = user; dst = network:n1; prt = tcp 80;
}
service:s2 = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
service:s3a = {
 user = network:n1;
 permit src = user; dst = network:n3; prt = tcp 80;
}
END
############################################################

print("====\n".join(' ',@ARGV)."\n");
my $with_travis = @ARGV && $ARGV[0] eq "travis";
prepare_export($with_travis, $netspoc);
prepare_runtime($with_travis, 1);

my ($path, $out, $title);

############################################################
$title = 'Take lexically first owner if multiple with same numbers';
############################################################

$out = ['o1'];
test_run($title, 'get_owner', {}, $out, \&extract_names);


############################################################
$title = 'Reset owner';
############################################################

$out = [];
test_run($title, 'set', { owner => '' }, $out, \&extract_records);

############################################################
$title = 'Take owner with largest number of services';
############################################################

$netspoc .= <<'END';
service:s3b = {
 user = network:n2;
 permit src = user; dst = network:n3; prt = tcp 80;
}
END
prepare_export($with_travis, $netspoc);

$out = ['o3'];
test_run($title, 'get_owner', {}, $out, \&extract_names);

############################################################
done_testing;
