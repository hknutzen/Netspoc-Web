
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

=TITLE=Change action of rule
=NETSPOC=
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/permit/deny/
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
         {"text": "action",
          "children": [
           {"text": "permit ➔ deny",
            "leaf": true
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

=TITLE=Ignore NAT
=NETSPOC=
[[netspoc]]
=NETSPOC2=
owner:o1 = { admins = guest; }
owner:o2 = { admins = guest; }

network:n1 = { ip = 10.1.1.0/24; owner = o1; nat:n1 = { ip = 10.9.1.0/24; } }
network:n2 = { ip = 10.1.2.0/24; owner = o2; }

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; hardware = n2; nat_out = n1; }
}
[[svc 1]]
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[]
=END=

=TITLE=Changed attribute: disabled
=NETSPOC=
[[netspoc]]
=NETSPOC2=
[[netspoc]]
=SUBST=/user =/disabled; user =/
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
     {"text": "details",
      "children": [
       {"text": "disabled",
        "children": [
         {"iconCls": "icon-add",
          "leaf": true
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

=TITLE=Changed attribute: disable_at
=NETSPOC=
[[netspoc]]
=SUBST=/user =/disable_at = 2099-01-01; user =/
=NETSPOC2=
[[netspoc]]
=SUBST=/user =/disable_at = 2099-12-31; user =/
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
     {"text": "details",
      "children": [
       {"text": "disable_at",
        "children": [
         {"text": "2099-01-01 ➔ 2099-12-31",
          "leaf": true
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

=TITLE=Changed attribute: description
=NETSPOC=
[[topo]]
service:s1 = {
 description = [ 123 ]
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 81;
}
=NETSPOC2=
[[topo]]
service:s1 = {
 description = abc
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 81;
}
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
     {"text": "details",
      "children": [
       {"text": "description",
        "children": [
         {"text": "[ 123 ] ➔ abc",
          "leaf": true
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

=TITLE=Changed position of user in rule
=NETSPOC=
[[topo]]
service:s1 = {
 user = network:n1;
 permit src = user; dst = network:n2; prt = tcp 81;
}
=NETSPOC2=
[[topo]]
service:s1 = {
 user = network:n1;
 permit src = network:n2; dst = user; prt = tcp 81;
}
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
         {"text": "dst",
          "children": [
           {"iconCls": "icon-delete",
            "children": [
             {"text": "network:n2",
              "leaf": true
             }]
           }]
         },
         {"text": "src",
          "children": [
           {"iconCls": "icon-add",
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

=TITLE=Ignore changed name of zone
=NETSPOC=
[[netspoc]]
=NETSPOC2=
any:n1 = { link = network:n1; }
[[netspoc]]
=URL=get_diff
=PARAMS=
active_owner=o1
history=p2
version=p1
=DIFF=
[]
=END=

=TEMPL=topo6
owner:o1 = { admins = guest; }
owner:o2 = { admins = guest; }

network:n1 = { ip = 10.1.1.0/24; ip6 = 2001:db8:1:1::/64; owner = o1; }
network:n2 = { ip = 10.1.2.0/24; ip6 = 2001:db8:1:2::/64; owner = o2; }

router:r1 = {
 managed;
 model = ASA;
 interface:n1 = { ip = 10.1.1.1; ip6 = 2001:db8:1:1::1; hardware = n1; }
 interface:n2 = { ip = 10.1.2.1; ip6 = 2001:db8:1:2::1; hardware = n2; }
}
=END=

=TITLE=Change IPv6 address of user object
=NETSPOC=
[[topo6]]
[[svc 1]]
=NETSPOC2=
[[topo6]]
[[svc 1]]
=SUBST=/1:1::/9:1::/


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
   {"text": "ip6",
    "children": [
    {"text": "2001:db8:1:1::/64 ➔ 2001:db8:9:1::/64",
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
