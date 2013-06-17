
Ext.define(
    'PolicyWeb.model.NetworkResources',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name     : 'ip',
              header   : 'IP-Adresse',
              width    : 0.25,
              sortType : function ( value ) {
                  var m = /-/;
                  if ( value.match(m) ) {
                      var array = value.split('-');
                      return ip2numeric( array[0] );
                  }
                  else {
                      return ip2numeric( value );
                  }
              }
            },
            { name    : 'name',
              header  : 'Name' },
            { name    : 'owner', 
              header  : 'Verantwortungsbereich',
              width   : 0.25,
              mapping :  function (node) {
                  return node.owner_alias || node.owner;
              }
            }
        ]
    }
);

