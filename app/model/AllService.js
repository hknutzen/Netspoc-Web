
Ext.define(
    'PolicyWeb.model.AllService',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name : 'service' },
            { name : 'action' },
            {
                name    : 'src',
                mapping : function( node ) {
                    return node.src.join( '<br>' );
                }
            },
            {
                name    : 'dst',
                mapping : function( node ) {
                    return node.dst.join( '<br>' );
                }
            },
            {
                name : 'proto',
                mapping : function( node ) {
                    return node.proto.join( '<br>' );
                }
            }
        ],
        proxy  : {
            url : 'backend/get_services_and_rules'
        }
    }
);
