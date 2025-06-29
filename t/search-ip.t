#!perl

use strict;
use Test::More;
use lib 't';

use PolicyWeb::Init qw/ $policy prepare_export/;
use PolicyWeb::Backend
  qw/prepare_runtime test_run extract_records extract_names/;

sub test_run_o {
    my ( $title, $path, $request, $owner, $out, $process_result ) = @_;

    $request->{active_owner} = $owner;
    $request->{history}      = $policy;
    test_run( $title, $path, $request, $out, $process_result );
}

############################################################
# Netspoc configuration
############################################################
my $data = <<'END';
--ipv4
owner:x = { admins = guest; show_all; }
owner:y = { admins = guest; }
owner:z = { admins = guest; }

area:all = { owner = x; anchor = network:Big; }
any:Big  = { link = network:Big; }
any:Sub1 = { ip = 10.1.0.0/23; link = network:Big; }
any:Sub2 = { ip = 10.1.1.0/25; link = network:Big; }

network:Sub = { ip = 10.1.1.0/24; owner = z; subnet_of = network:Big; }
router:u = {
 interface:Sub;
 interface:L = { ip = 10.3.3.3; loopback; }
 interface:Big = { ip = 10.1.0.2; }
}
network:Big = {
 ip = 10.1.0.0/16;
 nat:inet = { ip = 1.1.0.0/16; }
 host:B10 = { ip = 10.1.0.10; owner = z; }
 host:Range = { range = 10.1.0.90-10.1.0.99; }
}

router:asa = {
 managed;
 model = ASA;
 routing = manual;
 interface:Big    = { ip = 10.1.0.1; hardware = outside; }
 interface:Kunde  = { ip = 10.2.2.1; hardware = inside; }
 interface:KUNDE  = { ip = 10.2.3.1; hardware = inside; }
 interface:KUNDE1 = { ip = 10.2.4.1; hardware = inside; }
 interface:DMZ    = { ip = 10.9.9.1; hardware = dmz; }
}

network:Kunde  = { ip = 10.2.2.0/24; owner = y; host:k  = { ip = 10.2.2.2; } }
network:KUNDE  = { ip = 10.2.3.0/24; owner = y; host:K  = { ip = 10.2.3.3; } }
network:KUNDE1 = { ip = 10.2.4.0/24; owner = y; host:K1 = { ip = 10.2.4.4; } }
any:Kunde = { link = network:Kunde; }

network:DMZ = { ip = 10.9.9.0/24; }

router:FW = {
 managed;
 model = IOS;
 interface:DMZ = { ip = 10.9.9.2; hardware = DMZ; }
 interface:Internet = { negotiated; hardware = Internet; nat_out = inet; }
}

network:Internet = {
 ip = 0.0.0.0/0;
 has_subnets;
 host:INTERNET_192_53_103_103 = { ip = 192.53.103.103; }
}

router:ext = {
 interface:Internet;
 interface:extern;
}

network:extern = { ip = 1.2.0.0/16; }
any:extern_1-8 = { ip = 1.0.0.0/8; link = network:extern; }

service:Test1 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
}

service:Test2 = {
 description = My foo
 user = network:Big, any:Sub1;
 permit src = user; dst = host:k; prt = udp 80;
}

service:Test3 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 81;
}

service:Test3a = {
 multi_owner;
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
 permit src = user; dst = network:DMZ; prt = tcp 81;
}

service:Test4 = {
 description = Your foo
 multi_owner;
 user = host:B10, host:k, host:Range, interface:u.Big, network:DMZ;
 permit src = user; dst = host:k; prt = tcp 81;
 permit src = user; dst = host:B10; prt = tcp 82;
}

service:Test5 = {
 user = any:Big;
 permit src = user; dst = host:k; prt = tcp 82;
}

protocol:Test6 = udp 69:82; # Source port 69
service:Test6 = {
 user = host:B10;
 permit src = user; dst = any:Kunde; prt = protocol:Test6;
}

service:Test7 = {
 user = host:B10;
 permit src = user; dst = network:Internet; prt = udp 82;
}

service:Test8 = {
 user = host:B10;
 permit src = user; dst = any:extern_1-8; prt = udp 82;
}

service:Test9 = {
 user = host:B10, host:k;
 permit src = user; dst = user; prt = udp 83;
}

service:Test10 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE; prt = tcp 84, icmp 82, icmp 83;
}

service:Test11 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE1; prt = tcp 84, proto 82, icmp 4/13;
}

protocol:tftp = udp 69, oneway;
service:Test12 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE1; prt = tcp 80-85, protocol:tftp, icmp 3/13;
}
service:NTP = {
 user = interface:FW.Internet;
 permit src = host:INTERNET_192_53_103_103;
        dst = user;
        prt = udp 123;
}


area:all-ipv6 = { owner = x; anchor = network:n3; }
any:n3 = { link = network:n3; }
any:n4 = { link = network:n4; }
network:n3 = {
 ip6 = 1000::abcd:0003:0/112;
 host:h3 = { ip6 = 1000::abcd:0003:0003; }
 host:range3 = { range6 = 1000::abcd:0003:0002-1000::abcd:0003:0009; }
}
network:n4 = {
 ip6 = 1000::abcd:0004:0/112;
 host:h4= { ip6 = 1000::abcd:0004:0004; }
}
network:n5 = { ip6 = 1000::abcd:0005:0/112; }

router:r1 = {
 managed;
 model = ASA;
 interface:n3 = {ip6 = 1000::abcd:0003:0001; hardware = n3; }
 interface:n4 = {ip6 = 1000::abcd:0004:0001; hardware = n4; }
 interface:n5 = {ip6 = 1000::abcd:0005:0001; hardware = n5; }
}
service:V6_net_net = {
 user = network:n3;
 permit src = user; dst = network:n4; prt = tcp 83-84;
}
service:V6_host_host = {
 user = host:h3;
 permit src = user; dst = host:h4; prt = udp 123;
}
service:V6_range_host = {
 user = host:range3;
 permit src = user; dst = host:h4; prt = udp 123;
}
service:V6_range_net = {
 user = host:range3;
 permit src = user; dst = network:n5; prt = udp 123;
}
service:V6_any_host = {
 user = any:n3;
 permit src = user; dst = host:h4; prt = udp 123;
}
service:V6_host_any = {
 user = host:h3;
 permit src = user; dst = any:n4; prt = udp 123;
}
service:V6_any_any = {
 user = any:n3;
 permit src = user; dst = any:n4; prt = udp 123;
}
END
############################################################

prepare_export($data);
prepare_runtime();

my ( $path, $params, $owner, $out, $title );
$path = 'service_list';

############################################################
$title = 'Exact IP search in used services';
############################################################

$owner  = 'z';
$params = {
    search_ip1  => '10.1.1.0/24',
    search_ip2  => '10.2.2.0/24',
    search_used => 1,
};

$out = [qw(Test1 Test3 Test3a)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search in own services';
############################################################

$owner  = 'y';
$params = {
    search_ip1 => '10.1.0.0/16',
    search_ip2 => '10.2.2.2/32',
    search_own => 1,
};

$out = [qw(Test2)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for host';
############################################################

$owner  = 'x';
$params = {
    search_ip1  => '10.1.0.10/32',
    search_ip2  => '10.2.2.2',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test4 Test9)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for range';
############################################################

$params = {
    search_ip1  => '10.1.0.93/32',
    search_ip2  => '10.2.2.2',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test4)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for interface';
############################################################

$params = {
    search_ip1  => '10.1.0.2',
    search_ip2  => '10.2.2.2',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test4)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for aggregate';
############################################################

$params = {
    search_ip1  => '10.1.0.0/23',
    search_ip2  => '10.2.2.2',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test2)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for single address';
############################################################

$params = {
    search_ip1  => '10.2.2.0/24',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test1 Test3 Test3a)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IP search for internet or non matching aggregate';
############################################################

$params = {
    search_ip1  => '0.0.0.0/0',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test5 Test6 Test7)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Subnet IP search for interface of internet with negotiated address';
############################################################

$params = {
    search_ip1    => '0.0.0.0/0',
    search_ip2    => '192.53.0.0/16',
    search_own    => 1,
    search_used   => 1,
    search_subnet => 1,
};

$out = [qw(NTP)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IPv6 search for networks';
############################################################

$params = {
    search_ip1 => '1000::abcd:0003:0/112',
    search_ip2 => '1000::abcd:0004:0/112',
    search_own => 1,
};

$out = [qw(V6_net_net)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Exact IPv6 search for hosts and range';
############################################################

$params = {
    search_ip1 => '1000::abcd:0003:0003',
    search_ip2 => '1000::abcd:0004:0004',
    search_own => 1,
};

$out = [qw(V6_host_host V6_range_host)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'IPv6 subnet search';
############################################################

$params = {
    search_ip1    => '1000::abcd:0003:0/112',
    search_ip2    => '1000::abcd:0004:0/112',
    search_own    => 1,
    search_subnet => 1,
};

$out = [qw(V6_host_host V6_net_net V6_range_host)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'IPv6 supernet search';
############################################################

$params = {
    search_ip1      => '1000::abcd:0003:0/112',
    search_ip2      => '1000::abcd:0004:0004',
    search_own      => 1,
    search_supernet => 1,
};

$out = [qw(V6_any_any V6_any_host V6_net_net)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'IPv6 supernet of range search';
############################################################

$params = {
    search_ip1      => '1000::abcd:0003:0007',
    search_ip2      => '1000::abcd:0004:0004',
    search_own      => 1,
    search_supernet => 1,
};

$out = [qw(V6_any_any V6_any_host V6_net_net V6_range_host)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'IPv6 search with chosen networks';
############################################################

$params = {
    search_ip1      => '1000::abcd:0003:0007',
    search_own      => 1,
    search_supernet => 1,
    chosen_networks => 'network:n5',
};

$out = [qw(V6_range_net)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search for tcp protocol';
############################################################

$params = {
    search_proto => 'tcp',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test1 Test10 Test11 Test12 Test3 Test3a Test4 Test5 V6_net_net)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search for tcp port';
############################################################

$params = {
    search_proto => 'tcp 82',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test4 Test5)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Only find whole number';
############################################################

$params = {
    search_proto => 'tcp 8',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw()];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search port/protocol number';
############################################################

# Also match icmp and protocol numbers
$params = {
    search_proto => '82',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test10 Test11 Test4 Test5 Test6 Test7 Test8)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search port number in range';
############################################################

# Only match tcp and udp ports, no icmp or protocol numbers.
$params = {
    search_proto => '83',
    search_range => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test12 Test9 V6_net_net)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search port with modifier and source port';
############################################################

$params = {
    search_proto => '69',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test12 Test6)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search port and not source port';
############################################################

$params = {
    search_proto => '69',
    search_range => 1,
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test12)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Search protocol modifier, ignore case';
############################################################

$params = {
    search_proto => 'OneWay',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test12)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Find icmp code when searching for number';
############################################################

$params = {
    search_proto => '3',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test12)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Find icmp type when searching for number';
############################################################

$params = {
    search_proto => '13',
    search_own   => 1,
    search_used  => 1,
};

$out = [qw(Test11 Test12)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

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

$out = [qw(Test3)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Subnet IP search for single address';
############################################################

$params = {
    search_ip1    => '10.2.2.0/25',
    search_subnet => 1,
    search_own    => 1,
    search_used   => 1,
};

$out = [qw(Test2 Test4 Test5 Test9)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'IP search for single address and chosen network';
############################################################

$params = {
    search_ip1      => '10.2.2.2',
    search_own      => 1,
    search_used     => 1,
    chosen_networks => 'network:Sub,network:DMZ',
};

$out = [qw(Test4)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Supernet IP search for single address';
############################################################

$params = {
    search_ip1      => '10.2.2.0/25',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [qw(Test1 Test3 Test3a Test6)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Supernet IP search for aggregate';
############################################################

$params = {
    search_ip1      => '10.1.0.0/16',
    search_ip2      => '10.2.2.2',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [qw(Test2 Test5)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Supernet IP search finds all aggregates';
############################################################

$params = {
    search_ip1      => '1.0.0.0/8',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [qw(Test7 Test8)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Supernet IP search for loopback';
############################################################

$params = {
    search_ip1      => '10.3.3.3',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [qw(Test5)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Supernet IP search for unknown internet address';
############################################################

$params = {
    search_ip1      => '9.9.9.9',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [qw(Test7)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Text search in rules and users';
############################################################

$params = {
    search_ip1  => 'Sub',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test1 Test10 Test11 Test12 Test2 Test3 Test3a)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Case sensitive text search in rules and users';
############################################################

$params = {
    search_ip1            => 'KUNDE',
    search_case_sensitive => 1,
    search_own            => 1,
    search_used           => 1,
};

$out = [qw(Test10 Test11 Test12)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

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

$out = [qw(Test10)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Text search for type in rules and users';
############################################################

$params = {
    search_ip1  => 'any:',
    search_own  => 1,
    search_used => 1,
};

$out = [qw(Test2 Test5 Test6 Test8 V6_any_any V6_any_host V6_host_any)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Text search in rule names';
############################################################

$params = {
    search_string => 'Test3',
    search_own    => 1,
    search_used   => 1,
};

$out = [qw( Test3 Test3a)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Text search in description of rules';
############################################################

$params = {
    search_string  => 'foo',
    search_in_desc => 1,
    search_own     => 1,
    search_used    => 1,
};

$out = [qw( Test2 Test4)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Show matching users of service, 2x ip';
############################################################
$path = 'get_users';

# Rules match both, search_ip1 and search_ip2;
# hence find union of both in users
$params = {
    service       => 'Test4',
    search_ip1    => '10.1.0.0/16',
    search_ip2    => '10.2.2.2',
    search_subnet => 1,
};

$out = [qw(host:B10 host:Range interface:u.Big host:k)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Show matching users of service, 1x ip, chosen networks';
############################################################
$path = 'get_users';

$params = {
    service         => 'Test9',
    search_ip1      => '10.1.0.0/16',
    search_subnet   => 1,
    chosen_networks => 'network:DMZ',
};

$out = [qw(host:B10)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Show matching users of service, proto + 2x ip';
############################################################
$path = 'get_users';

$params = {
    service       => 'Test4',
    search_ip1    => '10.1.0.0/16',
    search_ip2    => '10.2.2.2',
    search_subnet => 1,
    search_proto  => '81',
};

$out = [qw(host:B10 host:Range interface:u.Big)];

test_run_o( $title, $path, $params, $owner, $out, \&extract_names );

############################################################
$title = 'Show matching rules with expanded users';
############################################################
$path = 'get_rules';

$params = {
    service          => 'Test4',
    search_ip1       => '10.2.2.2',
    search_ip2       => '10.1.0.10',
    search_proto     => '81',
    expand_users     => 1,
    display_property => 'name',
};

$out = [
    {
        action   => 'permit',
        dst      => ['host:k'],
        has_user => 'src',
        prt      => ['tcp 81'],
        src      => ['host:B10']
    }
];

test_run_o( $title, $path, $params, $owner, $out, \&extract_records );

############################################################
$title = 'Match only protocol in rules';
############################################################
$path = 'get_rules';

$params = {
    service          => 'Test4',
    search_proto     => '81',
    expand_users     => 1,
    display_property => 'name',
};

$out = [
    {
        action   => 'permit',
        dst      => ['host:k'],
        has_user => 'src',
        prt      => ['tcp 81'],
        src      => [
            'host:B10', 'host:Range',
            'host:k',   'interface:u.Big',
            'network:DMZ'
        ]
    }
];

test_run_o( $title, $path, $params, $owner, $out, \&extract_records );

############################################################
$title = 'Show matching rules of service with user -> user';
############################################################
$path = 'get_rules';

$params = {
    service    => 'Test9',
    search_ip1 => '10.2.2.2',
    search_ip2 => '10.1.0.10',
};

$out = [
    {
        action   => 'permit',
        dst      => [],
        has_user => 'both',
        prt      => ['udp 83'],
        src      => []
    }
];

test_run_o( $title, $path, $params, $owner, $out, \&extract_records );

############################################################
$title = 'Non-matching rules of service with user -> user';
############################################################
$path = 'get_rules';

# Must not find non-matching user->user rule.
$params = {
    service    => 'Test9',
    search_ip1 => '10.3.3.3',
};

$out = [];

test_run_o( $title, $path, $params, $owner, $out, \&extract_records );

############################################################
$title = 'Show services with rules of IP search';
############################################################
$path = 'get_services_and_rules';

$params = {
    search_ip1      => '1.0.0.0/8',
    search_supernet => 1,
    search_own      => 1,
    search_used     => 1,
};

$out = [
    {
        action   => 'permit',
        dst      => ['0.0.0.0/0'],
        has_user => 'src',
        prt      => ['udp 82'],
        service  => 'Test7',
        src      => ['User']
    },
    {
        action   => 'permit',
        dst      => ['1.0.0.0/8'],
        has_user => 'src',
        prt      => ['udp 82'],
        service  => 'Test8',
        src      => ['User']
    }
];

test_run_o( $title, $path, $params, $owner, $out, \&extract_records );

############################################################
done_testing;
