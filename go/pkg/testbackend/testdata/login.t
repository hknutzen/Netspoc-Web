
=TITLE=Failed login with empty email
=TEMPL=topo
owner:o1 = { admins = guest; }
network:n1 = { ip = 10.1.1.0/24; owner = o1; }
=NETSPOC=
[[topo]]
=PARAMS=
email=
pass=somepassword
=URL=login
=ERROR=Email is required
=STATUS=400

=TITLE=Failed login with empty password
=NETSPOC=
[[topo]]
=PARAMS=
email=foo@example.com
pass=
=URL=login
=ERROR=Password is required
=STATUS=400

=TITLE=Successful login
=NETSPOC=
[[topo]]
=PARAMS=
email=guest
=URL=login
=STATUS=302
