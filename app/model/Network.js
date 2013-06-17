
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
                sortType : function ( value ) {
                    var array = value.split('/');
                    return ip2numeric( array[0] );
                }
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

