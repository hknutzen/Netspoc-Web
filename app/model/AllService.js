
Ext.define(
    'PolicyWeb.model.AllService',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name : 'service',
              sortType : 'asUCString' 
            },
            { name : 'action' },
            { name : 'src',     mapping : function( node ) {
                  return node.src.join( '<br>' );
              }
            },
            { name : 'dst',      mapping : function( node ) {
                  return node.dst.join( '<br>' );
              }
            },
            { name : 'proto',      mapping : function( node ) {
                  return node.proto.join( '<br>' );
              }
            }
        ]
    }
);
