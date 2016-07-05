
Ext.define(
    'PolicyWeb.model.Network',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            {
                name     : 'ip',   
                header   : 'IP-Adresse',  
                width    : 0.25,
                mapping  : 'ip',
                sortType : function(value){
                    // Sort IP address numerically.
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
                //sortType : 'asIP'
            },
            { name      : 'name', header : 'Name' },
            { name      : 'owner',  
              header    : 'Verantwortungsbereich',
              width     : 0.25,
              mapping   : function (node) {
                  return node.owner_alias || node.owner;
              }
            }
        ]
    }
);

