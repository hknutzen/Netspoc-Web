#!perl

use strict;
use Test::More;
use lib 't';

use PolicyWeb::Init;
use PolicyWeb::BackendTest;


prepare_export();
PolicyWeb::BackendTest::prepare_runtime();

my ($path, $params, $owner, $out, $title);
$path = 'service_list';

############################################################
$title = 'Exact IP search in used services';
############################################################

$owner = 'z'; 
$params = {
    search_ip1   => '10.1.1.0/255.255.255.0',
    search_ip2   => '10.2.2.0/24',
    search_used  => 1,
};

$out = [ qw(Test1 Test3 Test3a) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search in own services';
############################################################

$owner = 'y'; 
$params = {
    search_ip1   => '10.1.0.0/255.255.0.0',
    search_ip2   => '10.2.2.2/32',
    search_own   => 1,
};

$out = [ qw(Test2) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search for host';
############################################################

$owner = 'x'; 
$params = {
    search_ip1   => '10.1.0.10/32',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4 Test9) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search for range';
############################################################

$params = {
    search_ip1   => '10.1.0.93/32',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search for interface';
############################################################

$params = {
    search_ip1   => '10.1.0.2',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test4) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search for aggregate';
############################################################

$params = {
    search_ip1   => '10.1.0.0/23',
    search_ip2   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/24',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test3 Test3a) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Search for protocol';
############################################################

$params = {
    search_proto => 'TCP',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test10 Test11 Test3 Test3a Test4 Test5) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Search for proto and exact IP';
############################################################

$params = {
    search_ip1   => '10.2.2.0/24',
    search_ip2   => '10.1.1.0/24',
    search_proto => '81',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test3) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Subnet IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/25',
    search_subnet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2 Test4 Test5 Test9) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Subnet IP search for single address and chosen network';
############################################################

$params = {
    search_ip1   => '10.2.2.2',
    search_own   => 1,
    search_used  => 1,
    chosen_networks => 'network:Sub,network:DMZ',
};

$out = [ qw(Test4 Test9) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Supernet IP search for single address';
############################################################

$params = {
    search_ip1   => '10.2.2.0/25',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test3 Test3a Test6) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Supernet IP search for aggregate';
############################################################

$params = {
    search_ip1   => '10.1.0.0/16',
    search_ip2   => '10.2.2.2',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2 Test5) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Supernet IP search finds all aggregates';
############################################################

$params = {
    search_ip1   => '10.0.0.0/8',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test7 Test8) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Supernet IP search for loopback';
############################################################

$params = {
    search_ip1   => '10.3.3.3',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test5) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Supernet IP search for unknown internet address';
############################################################

$params = {
    search_ip1   => '9.9.9.9',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test7) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Text search in rules and users';
############################################################

$params = {
    search_ip1   => 'Sub',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test1 Test10 Test11 Test2 Test3 Test3a) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Case sensitive text search in rules and users';
############################################################

$params = {
    search_ip1            => 'KUNDE',
    search_case_sensitive => 1,
    search_own            => 1,
    search_used           => 1,
};

$out = [ qw(Test10 Test11) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Exact match for text search in rules and users';
############################################################

$params = {
    search_ip1            => 'network:KUNDE',
    search_case_sensitive => 1,
    search_exact          => 1,
    search_own            => 1,
    search_used           => 1,
};

$out = [ qw(Test10) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Text search for type in rules and users';
############################################################

$params = {
    search_ip1   => 'any:',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw(Test2 Test5 Test6 Test8) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Text search in rule names';
############################################################

$params = {
    search_string => 'Test3',
    search_own   => 1,
    search_used  => 1,
};

$out = [ qw( Test3 Test3a) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Text search in description of rules';
############################################################

$params = {
    search_string  => 'foo',
    search_in_desc => 1,
    search_own     => 1,
    search_used    => 1,
};

$out = [ qw( Test2 Test4) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Show matching users of service, 2x ip';
############################################################
$path = 'get_users';

# Rules match both, search_ip1 and search_ip2;
# hence find union of both in users
$params = {
    service      => 'Test4',
    search_ip1   => '10.1.0.0/16',
    search_ip2   => '10.2.2.2',
    search_subnet => 1,
};

$out = [ qw(host:B10 host:Range interface:u.Big host:k) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Show matching users of service, 2x ip, chosen networks';
############################################################
$path = 'get_users';

# Rules match both, search_ip1 and search_ip2;
# hence find union of both in users
$params = {
    service      => 'Test9',
    search_ip1   => '10.1.0.0/16',
    search_subnet => 1,
    chosen_networks => 'network:DMZ',
};

$out = [ qw(host:B10) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Show matching users of service, proto + 2x ip';
############################################################
$path = 'get_users';

$params = {
    service      => 'Test4',
    search_ip1   => '10.1.0.0/16',
    search_ip2   => '10.2.2.2',
    search_subnet => 1,
    search_proto => '81',
};

$out = [ qw(host:B10 host:Range interface:u.Big) ];

test_run($title, $path, $params, $owner, $out, \&extract_names);

############################################################
$title = 'Show matching rules with expanded users';
############################################################
$path = 'get_rules';

$params = {
    service      => 'Test4',
    search_ip1   => '10.2.2.2',
    search_ip2   => '10.1.0.10',
    search_proto => '81',
    expand_users => 1,
    display_property => 'name',
};

$out = [ {                           
    action => 'permit',
    dst => [ 'host:k' ],
    prt => [ 'tcp 81' ],
    src => [ 'host:B10' ]
         }
    ];

test_run($title, $path, $params, $owner, $out, \&extract_records);

############################################################
$title = 'Match only protocol in rules';
############################################################
$path = 'get_rules';

$params = {
    service      => 'Test4',
    search_proto => '81',
    expand_users => 1,
    display_property => 'name',
};

$out = [ {                           
    action => 'permit',
    dst => [ 'host:k' ],
    prt => [ 'tcp 81' ],
    src => [ 'host:B10',
             'host:Range',
             'host:k',
             'interface:u.Big',
             'network:DMZ'
        ]
         }
    ];

test_run($title, $path, $params, $owner, $out, \&extract_records);

############################################################
$title = 'Show matching rules of service with user -> user';
############################################################
$path = 'get_rules';

$params = {
    service      => 'Test9',
    search_ip1   => '10.2.2.2',
    search_ip2   => '10.1.0.10',
};

$out = [ {                           
    action => 'permit',
    dst => [],
    has_user => 'both',
    prt => [ 'udp 83' ],
    src => []
         }
    ];

test_run($title, $path, $params, $owner, $out, \&extract_records);

############################################################
$title = 'Non-matching rules of service with user -> user';
############################################################
$path = 'get_rules';

# Must not find non-matching user->user rule.
$params = {
    service      => 'Test9',
    search_ip1   => '10.3.3.3',
};

$out = [ ];

test_run($title, $path, $params, $owner, $out, \&extract_records);

############################################################
$title = 'Show services with rules of IP search';
############################################################
$path = 'get_services_and_rules';

$params = {
    search_ip1   => '10.0.0.0/8',
    search_supernet => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [ {                     
    action => 'permit', 
    dst => [ '0.0.0.0/0.0.0.0' ],                  
    has_user => 'src',  
    proto => [ 'udp 82' ],                  
    service => 'Test7', 
    src => [ 'User' ]                   
  },                    
  {                     
    action => 'permit', 
    dst => [ '10.0.0.0/255.0.0.0' ],                  
    has_user => 'src',  
    proto => [ 'udp 82' ],                  
    service => 'Test8', 
    src => [ 'User' ]                   
  }                     
];

test_run($title, $path, $params, $owner, $out, \&extract_records);

############################################################
done_testing;
