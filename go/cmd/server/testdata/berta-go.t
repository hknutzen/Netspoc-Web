
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
=TITLE=Ignore job with unknown method
=NETSPOC=
[[topo]]
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "invalid", "params": {} }
=RESPONSE=
{
 "success": false,
 "message": "API failed:\nError: Unknown method 'invalid'\n"
}
=STATUS=200

############################################################
=TITLE=Job with missing params
=NETSPOC=
[[topo]]
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "add" }
=RESPONSE=
Missing attribute 'params'
=STATUS=400

############################################################
=TITLE=Successfully add user
=NETSPOC=
[[topo]]
service:a = {
 user = host:h10;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "add",
  "params": { "path": "service:a,user", "value": "host:h11" }
}
=RESPONSE=
{
 "success": true
}
=STATUS=200

############################################################
=TITLE=Warning empty user
=NETSPOC=
[[topo]]
service:a = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "delete",
  "params": { "path": "service:a,user", "value": "network:n1" }
}
=RESPONSE=
{
 "success": false,
 "message": "Netspoc warnings:\nWarning: user of service:a is empty\n"
}
=STATUS=200

############################################################
=TITLE=Error unknown service
=NETSPOC=
[[topo]]
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "delete",
  "params": { "path": "service:a,user", "value": "network:n1" }
}
=RESPONSE=
{
 "success": false,
 "message": "API failed:\nError: Can't modify unknown toplevel object 'service:a'\n"
}
=STATUS=200

############################################################
=TITLE=Netspoc config is invalid
=NETSPOC=
[[topo]]
network:n0 = { ip = 10.1.0.0/24; }
router:u = {
 interface:n0;
 interface:n1; # Missing IP address needed for static route
}
service:a = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "add",
  "params": { "path": "service:a,user", "value": "network:n0" }
}
=RESPONSE=
Error: API is currently unusable, because someone else has checked in bad files.
 Please try again later.

=STATUS=500

############################################################
=TITLE=Must not add outside of group
=NETSPOC=
[[topo]]
group:g1 = host:h10;
service:a = {
 user = group:g1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "add",
  "params": { "path": "service:a,user", "value": "host:h11" }
}
=RESPONSE=
{
 "success": false,
 "message": "service:a kann an dieser Stelle nicht erweitert werden.\nStattdessen müssen Gruppen angepasst werden:\n- group:g1"
}
=STATUS=200

############################################################
=TITLE=Delete outside of group with invalid Netspoc config
=NETSPOC=
[[topo]]
network:n0 = { ip = 10.1.0.0/24; }
router:u = {
 interface:n0;
 interface:n1; # Missing IP address needed for static route
}
group:g1 = host:h10, host:h11;
service:a = {
 user = group:g1;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "delete",
  "params": { "path": "service:a,user", "value": "host:h11" }
}
=RESPONSE=
{
 "success": false,
 "message": "\"host:h11\" kann in service:a nicht gefunden werden.\nHier werden Gruppen verwendet:\n- group:g1"
}
=STATUS=200

############################################################
=TITLE=Multi job: delete, delete, add host, add to user
=NETSPOC=
[[topo]]
group:g1 = host:h10;
service:a = {
 user = group:g1, host:h11;
 permit src = user; dst = network:n2; prt = tcp 80;
}
=KM_CONFIG=[[kmconf]]
=JOB=
{ "method": "multi_job",
  "jobs": [
    { "method": "delete",
      "params": { "path": "service:a,user", "value": "host:h10" }
    },
    { "method": "delete",
      "params": { "path": "service:a,user", "value": "host:h11" }
    },
    { "method": "multi_job",
      "jobs": [
        { "method": "add",
          "params": { "path": "network:n1,host:h12",
                      "value": { "ip": "10.1.1.12" }
          }
        },
        { "method": "add",
          "params": { "path": "service:a,user", "value": "host:h12" }
        }
      ]
    }
  ]
}
=RESPONSE=
{
 "success": false,
 "message": "\"host:h10\" kann in service:a nicht gefunden werden.\nHier werden Gruppen verwendet:\n- group:g1\nservice:a kann an dieser Stelle nicht erweitert werden.\nStattdessen müssen Gruppen angepasst werden:\n- group:g1"
}
=STATUS=200
