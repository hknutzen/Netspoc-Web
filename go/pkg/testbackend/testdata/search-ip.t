
=TEMPL=topo
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
 interface:Kunde  = { ip = 10.2.2.1; ip6 = 1000:abcd:2:2::1; hardware = inside; }
 interface:KUNDE  = { ip = 10.2.3.1; hardware = inside; }
 interface:KUNDE1 = { ip = 10.2.4.1; hardware = inside; }
 interface:DMZ    = { ip = 10.9.9.1;  ip6 = 1000:abcd:9:9::1; hardware = dmz; }
 interface:n3     = { ip6 = 1000::abcd:0003:1; hardware = n3; }
}

network:Kunde  = {
 ip = 10.2.2.0/24;
 nat:inet = { ip = 2.2.2.0/24; }
 ip6 = 1000:abcd:2:2::0/64;
 owner = y;
 auto_ipv6_hosts = readable;
 host:k  = { ip = 10.2.2.2; }
}
network:KUNDE  = { ip = 10.2.3.0/24; owner = y; host:K  = { ip = 10.2.3.3; } }
network:KUNDE1 = { ip = 10.2.4.0/24; owner = y; host:K1 = { ip = 10.2.4.4; } }
any:Kunde = { link = network:Kunde; }

network:DMZ = { ip = 10.9.9.0/24; ip6 = 1000:abcd:9:9::0/64; }

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
 disable_at = 2025-06-02;
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
=END=

############################################################
=TITLE=Exact IP search in used services
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=z
history=p1
search_ip1=10.1.1.0/24
search_ip2=10.2.2.0/24
search_used=1
=RESPONSE_NAMES=["Test1", "Test3", "Test3a"]

############################################################
=TITLE=Exact IP search in own services
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=y
history=p1
search_ip1=10.1.0.0/16
search_ip2=10.2.2.2/32
search_own=1
=RESPONSE_NAMES=["Test2"]

############################################################
=TITLE=Exact IP search for host
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.10/32
search_ip2=10.2.2.2
search_own=1
search_used=1
=RESPONSE_NAMES=["Test4", "Test9"]

############################################################
=TITLE=Exact IP search for range
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.93/32
search_ip2=10.2.2.2
search_own=1
search_used=1
=RESPONSE_NAMES=["Test4"]

############################################################
=TITLE=Exact IP search for interface
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.2
search_ip2=10.2.2.2
search_own=1
search_used=1
=RESPONSE_NAMES=["Test4"]

############################################################
=TITLE=Exact IP search for aggregate
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.0/23
search_ip2=10.2.2.2
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2"]

############################################################
=TITLE=Exact IP search for single address
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.2.2.0/24
search_own=1
search_used=1
=RESPONSE_NAMES=["Test1", "Test3", "Test3a"]

############################################################
=TITLE=Exact IP search for IPv6 address of network with IPv4 NAT
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000:abcd:2:2::0/64
search_own=1
search_used=1
=RESPONSE_NAMES=["Test1", "Test3", "Test3a"]

############################################################
=TITLE=Exact IP search for internet or non matching aggregate
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=0.0.0.0/0
search_own=1
search_used=1
=RESPONSE_NAMES=["Test5", "Test6", "Test7"]

############################################################
=TITLE=Subnet IP search for interface of internet with negotiated address
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=0.0.0.0/0
search_ip2=192.53.0.0/16
search_own=1
search_used=1
search_subnet=1
=RESPONSE_NAMES=["NTP"]

############################################################
=TITLE=Exact IPv6 search for networks
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0/112
search_ip2=1000::abcd:0004:0/112
search_own=1
=RESPONSE_NAMES=["V6_net_net"]

############################################################
=TITLE=Exact IPv6 search for hosts and range
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0003
search_ip2=1000::abcd:0004:0004
search_own=1
=RESPONSE_NAMES=["V6_host_host", "V6_range_host"]

############################################################
=TITLE=IPv6 subnet search
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0/112
search_ip2=1000::abcd:0004:0/112
search_own=1
search_subnet=1
=RESPONSE_NAMES=["V6_host_host", "V6_net_net", "V6_range_host"]

############################################################
=TITLE=IPv6 supernet search
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0/112
search_ip2=1000::abcd:0004:0004
search_own=1
search_supernet=1
=RESPONSE_NAMES=["V6_any_any", "V6_any_host", "V6_net_net"]

############################################################
=TITLE=IPv6 supernet of range search
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0007
search_ip2=1000::abcd:0004:0004
search_own=1
search_supernet=1
=RESPONSE_NAMES=["V6_any_any", "V6_any_host", "V6_net_net", "V6_range_host"]

############################################################
=TITLE=IPv6 search with chosen networks
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1000::abcd:0003:0007
search_own=1
search_supernet=1
chosen_networks=network:n5
=RESPONSE_NAMES=["V6_range_net"]

############################################################
=TITLE=Search for tcp protocol
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=tcp
search_own=1
search_used=1
=RESPONSE_NAMES=["Test1", "Test10", "Test11", "Test12", "Test3", "Test3a", "Test4", "Test5", "V6_net_net"]

############################################################
=TITLE=Search for tcp port
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=tcp 82
search_own=1
search_used=1
=RESPONSE_NAMES=["Test4", "Test5"]

############################################################
=TITLE=Only find whole number
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=tcp 8
search_own=1
search_used=1
=RESPONSE_NAMES=[]

############################################################
=TITLE=Search port/protocol number
# Also match icmp and protocol numbers.
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=82
search_own=1
search_used=1
=RESPONSE_NAMES=["Test10", "Test11", "Test4", "Test5", "Test6", "Test7", "Test8"]

############################################################
=TITLE=Search port number in range
# Only match tcp and udp ports, no icmp or protocol numbers.
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=83
search_range=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test12", "Test9", "V6_net_net"]

############################################################
=TITLE=Search port with modifier and source port
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=69
search_own=1
search_used=1
=RESPONSE_NAMES=["Test12", "Test6"]

############################################################
=TITLE=Search port and not source port
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=69
search_range=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test12"]

############################################################
=TITLE=Search protocol modifier, ignore case
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=OneWay
search_own=1
search_used=1
=RESPONSE_NAMES=["Test12"]

############################################################
=TITLE=Find icmp code when searching for number
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=3
search_own=1
search_used=1
=RESPONSE_NAMES=["Test12"]

############################################################
=TITLE=Find icmp type when searching for number
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_proto=13
search_own=1
search_used=1
=RESPONSE_NAMES=["Test11", "Test12"]

############################################################
=TITLE=Search for proto and exact IP
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.2.2.0/24
search_ip2=10.1.1.0/24
search_proto=81
search_own=1
search_used=1
=RESPONSE_NAMES=["Test3"]

############################################################
=TITLE=Subnet IP search for single address
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.2.2.0/25
search_subnet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2", "Test4", "Test5", "Test9"]

############################################################
=TITLE=IP search for single address and chosen network
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.2.2.2
search_own=1
search_used=1
chosen_networks=network:Sub,network:DMZ
=RESPONSE_NAMES=["Test4"]

############################################################
=TITLE=Supernet IP search for single address
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.2.2.0/25
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test1", "Test3", "Test3a", "Test6"]

############################################################
=TITLE=Supernet IP search for host address finds enclosing network
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.10
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2", "Test4", "Test5", "Test6", "Test7", "Test8", "Test9"]

############################################################
=TITLE=Supernet IP search for aggregate
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.1.0.0/16
search_ip2=10.2.2.2
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2", "Test5"]

############################################################
=TITLE=Supernet IP search finds all aggregates
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=1.0.0.0/8
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test7", "Test8"]

############################################################
=TITLE=Supernet IP search for loopback
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=10.3.3.3
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test5"]

############################################################
=TITLE=Supernet IP search for unknown internet address
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=9.9.9.9
search_supernet=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test7"]

############################################################
=TITLE=Text search in rules and users
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=Sub
search_own=1
search_used=1
=RESPONSE_NAMES=["Test1", "Test10", "Test11", "Test12", "Test2", "Test3", "Test3a"]

############################################################
=TITLE=Case sensitive text search in rules and users
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=KUNDE
search_case_sensitive=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test10", "Test11", "Test12"]

############################################################
=TITLE=Exact match for text search in rules and users
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=network:KUNDE
search_case_sensitive=1
search_exact=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test10"]

############################################################
=TITLE=Text search for type in rules and users
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_ip1=any:
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2", "Test5", "Test6", "Test8", "V6_any_any", "V6_any_host", "V6_host_any"]

############################################################
=TITLE=Text search in rule names
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_string=Test3
search_own=1
search_used=1
=RESPONSE_NAMES=["Test3", "Test3a"]

############################################################
=TITLE=Text search in description of rules
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_string=foo
search_in_desc=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test2", "Test4"]

############################################################
=TITLE=Show matching users of service, 2x ip
# Rules match both, search_ip1 and search_ip2;
# hence find union of both in users
=NETSPOC=
[[topo]]
=URL=get_users
=PARAMS=
active_owner=x
history=p1
service=Test4
search_ip1=10.1.0.0/16
search_ip2=10.2.2.2
search_subnet=1
=END=
# Dual stack object "host:k" gives two entries with different IP addresses.
=RESPONSE_NAMES=["host:B10", "host:Range", "interface:u.Big", "host:k", "host:k"]

############################################################
=TITLE=Show matching users of service, 1x ip, chosen networks
=NETSPOC=
[[topo]]
=URL=get_users
=PARAMS=
active_owner=x
history=p1
service=Test9
search_ip1=10.1.0.0/16
search_subnet=1
chosen_networks=network:DMZ
=RESPONSE_NAMES=["host:B10"]

############################################################
=TITLE=Show matching users of service, proto + 2x ip
=NETSPOC=
[[topo]]
=URL=get_users
=PARAMS=
active_owner=x
history=p1
service=Test4
search_ip1=10.1.0.0/16
search_ip2=10.2.2.2
search_subnet=1
search_proto=81
=RESPONSE_NAMES=["host:B10", "host:Range", "interface:u.Big"]

############################################################
=TITLE=Show matching rules with expanded users
=NETSPOC=
[[topo]]
=URL=get_rules
=PARAMS=
active_owner=x
history=p1
service=Test4
search_ip1=10.2.2.2
search_ip2=10.1.0.10
search_proto=81
expand_users=1
display_property=name
=RESPONSE=
[
    {
        "action"   : "permit",
        "dst"      : ["host:k"],
        "has_user" : "src",
        "prt"      : ["tcp 81"],
        "src"      : ["host:B10"]
    }
]
=END=

############################################################
=TITLE=Match only protocol in rules
=NETSPOC=
[[topo]]
=URL=get_rules
=PARAMS=
active_owner=x
history=p1
service=Test4
search_proto=81
expand_users=1
display_property=name
=RESPONSE=
[
    {
        "action"   : "permit",
        "dst"      : ["host:k"],
        "has_user" : "src",
        "prt"      : ["tcp 81"],
        "src"      : [
            "host:B10", "host:Range",
            "host:k",   "interface:u.Big",
            "network:DMZ"
        ]
    }
]
=END=

############################################################
=TITLE=Show matching rules of service with user -> user
=NETSPOC=
[[topo]]
=URL=get_rules
=PARAMS=
active_owner=x
history=p1
service=Test9
search_ip1=10.2.2.2
search_ip2=10.1.0.10
=RESPONSE=
[
    {
        "action"   : "permit",
        "dst"      : [],
        "has_user" : "both",
        "prt"      : ["udp 83"],
        "src"      : []
    }
]
=END=

############################################################
=TITLE=Non-matching rules of service with user -> user
# Must not find non-matching user->user rule.
=NETSPOC=
[[topo]]
=URL=get_rules
=PARAMS=
active_owner=x
history=p1
service=Test9
search_ip1=10.3.3.3
=RESPONSE=[]

############################################################
=TITLE=Show services with rules of IP search
=NETSPOC=
[[topo]]
=URL=get_services_and_rules
=PARAMS=
active_owner=x
history=p1
search_ip1=1.0.0.0/8
search_supernet=1
search_own=1
search_used=1
=RESPONSE=
[
    {
        "action"   : "permit",
        "dst"      : ["0.0.0.0/0"],
        "has_user" : "src",
        "prt"      : ["udp 82"],
        "service"  : "Test7",
        "src"      : ["User"]
    },
    {
        "action"   : "permit",
        "dst"      : ["1.0.0.0/8"],
        "has_user" : "src",
        "prt"      : ["udp 82"],
        "service"  : "Test8",
        "src"      : ["User"]
    }
]
=END=

############################################################

=TITLE=Show time limited services in search
=NETSPOC=
[[topo]]
=URL=service_list
=PARAMS=
active_owner=x
history=p1
search_string=Test
search_disable_at=1
search_own=1
search_used=1
=RESPONSE_NAMES=["Test11"]
