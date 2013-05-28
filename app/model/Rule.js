
var bold_user = function ( node, what ) {
    if ( node.has_user === what || node.has_user === 'both' ) {
        return '<span style="font-weight:bold;"> User </span>';
    }
    else {
        return what === 'src' ?  node.src.join( '<br>' ) :
            node.dst.join( '<br>' );
    }
};

Ext.define(
    'PolicyWeb.model.Rule',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name : 'has_user', mapping : 'hasuser'  },
            { name : 'action',   mapping : 'action'  },
            { name : 'src',      mapping : function( node ) {
                  return bold_user( node, 'src' );
              }
            },
            { name : 'dst',      mapping : function( node ) {
                  return bold_user( node, 'dst' );
              }
            },
            { name : 'prt',      mapping : function( node ) {
                  return node.prt.join( '<br>' );
              }
            }
        ]
    }
);

