
=TEMPL=topo
owner:o1 = { admins = guest; }
owner:o2 = { admins = guest; }
owner:o3 = { admins = guest; }

network:n1 = { ip = 10.1.1.0/24; owner = o1; }
network:n2 = { ip = 10.1.2.0/24; owner = o2; }
network:n3 = { ip = 10.1.3.0/24; owner = o3;}

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; }
 interface:n3 = { ip = 10.1.3.1; hardware = n3; }
}
=END=

=TEMPL=svc
service:s{{.}} = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 8{{.}};
 #add rule
}
=END=

=TEMPL=netspoc
[[topo]]
[[svc 1]]
=END=

=TITLE=Change IP of user object
=NETSPOC=
[[netspoc]]
=NETSPOC2=
[[netspoc]]
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/n1/nx/
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/user = network:n1/user = network:n1, network:n3/
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/tcp 81/tcp 8081/
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
             {"text": "tcp 8081",
              "leaf": true
             }]
           },
           {"iconCls": "icon-delete",
            "children": [
             {"text": "tcp 81",
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/o2/ox/
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

=TITLE=Change owner of service to multi owner
=NETSPOC=
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/dst = network:n2/dst = network:n2, network:n3/
=URL=get_diff
=PARAMS=
active_owner=o2
history=p2
version=p1
=DIFF=
[
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
           {"text": "o3",
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
           {"iconCls": "icon-add",
            "children": [
             {"text": "network:n3",
              "leaf": true
             }]
           }]
         }]
       }]
     }]
  }]
 },
 {"text": "service_lists owner",
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
[[svc 2]]
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
[[netspoc]]
[[svc 2]]
=NETSPOC2=
[[netspoc]]
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
[[netspoc]]
=NETSPOC2=
[[netspoc]]
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

=TITLE=Add and remove multiple services
=NETSPOC=
[[topo]]
[[svc 3]]
[[svc 5]]
=NETSPOC2=
[[topo]]
[[svc 1]]
[[svc 2]]
[[svc 3]]
[[svc 4]]
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
     {"text": "s1",
      "leaf": true
     },
     {"text": "s2",
      "leaf": true
     },
     {"text": "s4",
      "leaf": true
     }]
   },
   {"iconCls": "icon-delete",
    "children": [
     {"text": "s5",
      "leaf": true
     }]
   }]
 }
]
=END=
