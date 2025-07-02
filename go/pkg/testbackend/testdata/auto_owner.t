
=TEMPL=topo
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
=END=

############################################################
=TITLE=Take lexically first owner if multiple with same numbers
=NETSPOC=
[[topo]]
=URL=get_owner
=RESPONSE_NAMES=["o1"]

############################################################
=TITLE=Reset owner
=NETSPOC=
[[topo]]
=URL=set
=PARAMS=owner=
=RESPONSE=[]

############################################################
=TITLE=Take owner with largest number of services
=NETSPOC=
[[topo]]
service:s3b = {
 user = network:n2;
 permit src = user; dst = network:n3; prt = tcp 80;
}
=URL=get_owner
=RESPONSE_NAMES=["o3"]
