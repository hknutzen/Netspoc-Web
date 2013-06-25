
Ext.define(
    'PolicyWeb.model.Supervisor',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { 
                name : 'alias', 
                mapping : function(node) { 
                    return node.alias || node.name;
                }
            },
            { name : 'name' }
        ]
    }
);

