
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
=END=

############################################################

=TITLE=GO-TEST Display prop ip
=NETSPOC=
[[topo]]
=JOB=
{
  "params": {
    service => "s1",
    active_owner => "o1",
    display_property => "ip",
  }
}
=RESPONSE=
{
    action   => 'permit',
    dst      => ['10.1.1.0/24'],
    has_user => 'src',
    prt      => ['tcp 80'],
    src      => []
}
=STATUS=200
