
=TEMPL=topo
owner:o1 = { admins = x@example.com; }
owner:o2 = { admins = x@example.com; }
owner:o3 = { admins = x@example.com; }

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

=TITLE=Send_diff is empty initially.
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=URL=get_diff_mail
=PARAMS=
active_owner=o1
=RESPONSE=
[{	"send": false }]
=GET_SEND_DIFF=

=TITLE=Send_diff is active for multile owners and current owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o3 o4
=URL=get_diff_mail
=PARAMS=
active_owner=o3
=RESPONSE=
[{	"send": true }]

=TITLE=Send_diff is not active for current owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o4
=URL=get_diff_mail
=PARAMS=
active_owner=o3
=RESPONSE=
[{	"send": false }]

=TITLE=Send_diff is active for multile owners but not for current owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o3 o4
=URL=get_diff_mail
=PARAMS=
active_owner=o5
=RESPONSE=
[{	"send": false }]

=TITLE=Add send_diff for single owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=URL=set_diff_mail
=PARAMS=
active_owner=o1
send=true
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=o1

=TITLE=Add send_diff for additional owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o4
=URL=set_diff_mail
=PARAMS=
active_owner=o3
send=true
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=o1 o2 o4 o3

=TITLE=Add send_diff that is already set
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o3 o4
=URL=set_diff_mail
=PARAMS=
active_owner=o3
send=true
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=o1 o2 o3 o4

=TITLE=Remove send_diff for single owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1
=URL=set_diff_mail
=PARAMS=
active_owner=o1
send=false
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=

=TITLE=Remove send_diff from multiple owners
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o3 o4
=URL=set_diff_mail
=PARAMS=
active_owner=o3
send=false
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=o1 o2 o4

=TITLE=Remove send_diff that is not set
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=SET_SEND_DIFF=o1 o2 o4
=URL=set_diff_mail
=PARAMS=
active_owner=o3
send=false
=RESPONSE=
[{ "success" : true }]
=GET_SEND_DIFF=o1 o2 o4

=TITLE=Not allowed to set send_diff for current owner
=NETSPOC=
[[topo]]
=EMAIL=x@example.com
=PASSWORD=secret
=URL=set_diff_mail
=PARAMS=
active_owner=o4
send=true
=ERROR=Not authorized to access owner 'o4'
=STATUS=400
