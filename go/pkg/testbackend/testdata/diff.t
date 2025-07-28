
=TEMPL=topo
owner:o1 = { admins = x@example.com; }
owner:o2 = { admins = y@example.com; }
owner:o3 = { admins = z@example.com; }

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
=END=

############################################################
=TITLE=Send_diff should be empty initially.
=NETSPOC=
[[topo]]
=USER=x@example.com
=PASSWORD=secret
=URL=get_diff_mail
=RESPONSE=[]
