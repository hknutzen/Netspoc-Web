
Ext.define(
    'PolicyWeb.model.User',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name     : 'name'  , 
              header   : 'Name'
            },
            { name     : 'ip',
              header   : 'IP-Adressen',
              width    : 0.25,
              sortType : function ( value ) {
                  var m1 = /-/;
                  var m2 = /\//;
                  var array;
                  if ( value.match(m1) ) {
                      array = value.split('-');
                      return ip2numeric( array[0] );
                  }
                  else if ( value.match(m2) ) {
                      array = value.split('/');
                      return ip2numeric( array[0] );
                  }
                  else {
                      return ip2numeric( value );
                  }
              }
            },
            // Not shown, but needed to select the corresponding
            // email addresses.
            { name    : 'owner' },
            { name    : 'owner_alias', 
              header  : 'Verantwortungsbereich',
              width   : 0.25,
              mapping : function (node) { 
                  return node.owner_alias || node.owner;
              }
            }
        ]
    }
);

