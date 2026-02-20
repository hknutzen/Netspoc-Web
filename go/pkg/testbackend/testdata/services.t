
=TEMPL=topo
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
=END=

############################################################

=TITLE=Empty service_list for unknown owner
=NETSPOC=
[[topo]]
=URL=service_list

=PARAMS=active_owner=FOO&search_own=1&search_used=1&search_ip1=10.1.2.0/24
=RESPONSE=
[]
=STATUS=200
