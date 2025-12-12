
=TEMPL=topo
owner:o1 = { admins = guest; }
owner:o2 = { admins = guest; }

network:n1 = { ip = 10.1.1.0/24; owner = o1; }
network:n2 = { ip = 10.1.2.0/24; owner = o2; }
network:n3 = { ip = 10.1.3.0/24; }

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
 interface:n3 = { ip = 10.1.3.1; hardware = n3; }
}

service:s1 = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 80;
 #add rule
}
=END=

=TITLE=Change IP of user object
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|10.1.1.0/24|10.1.1.0/25|
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "objects",
  "children": [
  {"text": "network:n1",
   "children": [
   {"text": "ip",
    "children": [
    {"text": "10.1.1.0/24 ➔ 10.1.1.0/25",
     "leaf": true
    }]
   }]
  }]
 },
 {"text": "users",
  "children": [
  {"text": "s1",
   "children": [
   {"iconCls": "icon-page_edit",
    "children": [
    {"text": "network:n1",
     "leaf": true
    }]
   }]
  }]
 }
]
=END=

=TITLE=Change name of user object
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|n1|nx|
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "users",
  "children": [
  {"text": "s1",
   "children": [
   {"iconCls": "icon-add",
    "children": [
    {"text": "network:nx",
     "leaf": true
    }]
   },
   {"iconCls": "icon-delete",
    "children": [
    {"text": "network:n1",
     "leaf": true
    }]
   }]
  }]
 }
]
=END=

=TITLE=Add user object
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|user = network:n1|user = network:n1, network:n3|
=URL=get_diff
=PARAMS=
active_owner=o2
history=p2
version=p1
=DIFF=
[
 {"text": "users",
  "children": [
   {"text": "s1",
    "children": [
     {"iconCls": "icon-add",
      "children": [
       {"text": "network:n3",
        "leaf": true
       }]
     }]
   }]
 }
]
=END=

=TITLE=Change protocol of rule
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|tcp 80|tcp 8080|
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "services",
  "children": [
   {"text": "s1",
    "children": [
     {"text": "rules",
      "children": [
       {"text": "1",
        "children": [
         {"text": "prt",
          "children": [
           {"iconCls": "icon-add",
            "children": [
             {"text": "tcp 8080",
              "leaf": true
             }]
           },
           {"iconCls": "icon-delete",
            "children": [
             {"text": "tcp 80",
              "leaf": true
             }]
           }]
         }]
       }]
     }]
   }]
 },
 {"text": "service_lists user",
  "children": [
   {"iconCls": "icon-page_edit",
    "children": [
     {"text": "s1",
      "leaf": true
     }]
   }]
 }
]
=END=

=TITLE=Change owner of rule object and thereby owner of service
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|o2|ox|
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "objects",
  "children": [
  {"text": "network:n2",
   "children": [
   {"text": "owner",
    "children": [
    {"text": "o2 ➔ ox",
     "leaf": true
    }]
   }]
  }]
 },
 {"text": "services",
  "children": [
   {"text": "s1",
    "children": [
     {"text": "details",
      "children": [
       {"text": "owner",
        "children": [
         {"iconCls": "icon-add",
          "children": [
           {"text": "ox",
            "leaf": true
           }]
         },
         {"iconCls": "icon-delete",
          "children": [
           {"text": "o2",
            "leaf": true
           }]
         }]
       }]
     },
     {"text": "rules",
      "children": [
       {"text": "1",
        "children": [
         {"text": "dst",
          "children": [
           {"iconCls": "icon-page_edit",
            "children": [
             {"text": "network:n2",
              "leaf": true
             }]
           }]
         }]
       }]
     }]
  }]
 },
 {"text": "service_lists user",
  "children": [
   {"iconCls": "icon-page_edit",
    "children": [
     {"text": "s1",
      "leaf": true
     }]
   }]
 }
]
=END=

=TITLE=Add service
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
service:s2 = {
 user = network:n1;
 permit src = user; dst = network:n3; prt = tcp 88;
}
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "service_lists user",
  "children": [
   {"iconCls": "icon-add",
    "children": [
     {"text": "s2",
      "leaf": true
     }]
   }]
 }
]
=END=

=TITLE=Remove service
=NETSPOC=
[[topo]]
service:s2 = {
 user = network:n1;
 permit src = user; dst = network:n3; prt = tcp 88;
}
=NETSPOC2=
[[topo]]
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "service_lists user",
  "children": [
   {"iconCls": "icon-delete",
    "children": [
     {"text": "s2",
      "leaf": true
     }]
   }]
 }
]
=END=

=TITLE=Add rule
=NETSPOC=
[[topo]]
=NETSPOC2=
[[topo]]
=SUBST=|#add rule|permit src = network:n2; dst = user; prt = icmp 3/13;|
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[
 {"text": "services",
  "children": [
   {"text": "s1",
    "children": [
     {"text": "rules",
      "children": [
       {"iconCls": "icon-page_edit",
        "leaf": true
       }]
     }]
   }]
 },
 {"text": "service_lists user",
  "children": [
   {"iconCls": "icon-page_edit",
    "children": [
     {"text": "s1",
      "leaf": true
     }]
   }]
 }
]
=END=