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

network:n1 = {
  ip = 10.1.1.0/24;
  owner = o1;
  host:host_in_n1 = { ip = 10.1.1.2; }
}
network:n2 = { ip = 10.1.2.0/24; owner = o1; }
network:n3 = { ip = 10.1.3.0/24; owner = o1; }
network:n4 = { ip = 10.1.4.0/24; }

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
 interface:n3 = { ip = 10.1.3.1; hardware = n3; }
 interface:n4 = { ip = 10.1.4.1; hardware = n4; }
}

service:s1 = {
 user = network:n2;
 permit src = user; dst = network:n1; prt = tcp 80;
}
service:s2 = {
 user = network:n1;
 permit src = network:n2; dst = user; prt = tcp 80;
}
service:s3 = {
 user = network:n1;
 permit src = network:n2,network:n3; dst = user; prt = tcp 80;
}
service:s4 = {
 user = network:n1;
 permit src = user; dst = network:n2,network:n3; prt = tcp 80;
}
service:s5 = {
 user = any:[ip = 10.1.0.0/16 & network:n1, network:n2];
 permit src = user;
        dst = any:[ip = 10.4.0.0/16 & network:n3,network:n4];
        prt = tcp 80;
}
END
############################################################

prepare_export($netspoc);
prepare_runtime();

my ($path, $out, $title, $opt);

############################################################
$title = 'Display prop "ip"';
############################################################

$out = [
   {
     action => 'permit',
     dst => [
       '10.1.1.0/24'
     ],
     has_user => 'src',
     prt => [
       'tcp 80'
     ],
     src => []
   }
    ];

$opt = {
    service => "s1",
    active_owner => "o1",
    display_property => "ip",
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);

############################################################
$title = 'Display prop "ip", expand user, remove duplicates';
############################################################

$out = [
   {
     action => 'permit',
     src => [ '10.1.0.0/16' ],
     dst => [ '10.4.0.0/16' ],
     has_user => 'src',
     prt => [ 'tcp 80' ],
   }
    ];

$opt = {
    service => "s5",
    active_owner => "o1",
    display_property => "ip",
    expand_users => 1,
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);



############################################################
$title = 'Display prop "name"';
############################################################

$out = [
   {
     action => 'permit',
     src => [
       'network:n2'
     ],
     has_user => 'dst',
     prt => [
       'tcp 80'
     ],
     dst => []
   }
    ];

$opt = {
    service => "s2",
    active_owner => "o1",
    display_property => "name",
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);


############################################################
$title = 'Display prop "ip_and_name", has_user => dst';
############################################################

$out = [
   {
     action => 'permit',
     src => [
         {
             ip => '10.1.2.0/24',
             name => 'network:n2',
         },
         {
             ip => '10.1.3.0/24',
             name => 'network:n3',
         }
         ],
     has_user => 'dst',
     prt => [
         'tcp 80'
         ],
     dst => []
   }
    ];

$opt = {
    service => "s3",
    active_owner => "o1",
    display_property => "ip_and_name",
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);

############################################################
$title = 'Display prop "ip_and_name", has_user => src';
############################################################

$out = [
   {
     action => 'permit',
     dst => [
         {
             ip => '10.1.2.0/24',
             name => 'network:n2',
         },
         {
             ip => '10.1.3.0/24',
             name => 'network:n3',
         }
         ],
     has_user => 'src',
     prt => [
         'tcp 80'
         ],
     src => []
   }
    ];

$opt = {
    service => "s4",
    active_owner => "o1",
    display_property => "ip_and_name",
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);

############################################################
$title = 'Display prop "ip_and_name" with "expand_users"';
############################################################

$out = [
    {
        action => 'permit',
        src => [
            {
                ip => '10.1.0.0/16',
                name => 'any:[ip=10.1.0.0/16 & network:n1]',
            },
            {
                ip => '10.1.0.0/16',
                name => 'any:[ip=10.1.0.0/16 & network:n2]',
            },
            ],
        prt => [
            'tcp 80'
            ],
       dst => [
            {
                ip => '10.4.0.0/16',
                name => 'any:[ip=10.4.0.0/16 & network:n3]',
            },
            {
                ip => '10.4.0.0/16',
                name => 'any:[ip=10.4.0.0/16 & network:n4]',
            },
            ],
       has_user => 'src',
    }
    ];

$opt = {
    service => "s5",
    active_owner => "o1",
    display_property => "ip_and_name",
    expand_users => 1
};
test_run($title, 'get_rules', $opt, $out, \&extract_records);


############################################################
$title = 'Test get_networks_and_resources';
############################################################

$out = [
    {
        name => 'network:n1',
        ip => '10.1.1.0/24',
        owner => 'o1',
        children => [
            {
                ip => '10.1.1.2',
                name => 'host:host_in_n1',
                owner => 'o1'
            },
            {
                ip => '10.1.1.1',
                name => 'interface:r1.n1',
                owner => undef
            }
            ]
    },
    {
        name => 'network:n2',
        ip => '10.1.2.0/24',
        owner => 'o1',
        children => [
            {
                ip => '10.1.2.1',
                name => 'interface:r1.n2',
                owner => undef
            }
            ]
    },
    {
        name => 'network:n3',
        ip => '10.1.3.0/24',
        owner => 'o1',
        children => [
            {
                ip => '10.1.3.1',
                name => 'interface:r1.n3',
                owner => undef
            }
            ]
    }
    ];

$opt = {
    active_owner => "o1",
};
test_run($title, 'get_networks_and_resources', $opt, $out, \&extract_records);



############################################################
done_testing;
