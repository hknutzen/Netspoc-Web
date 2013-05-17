
Ext.define(
    'PolicyWeb.model.Owner',
    {
        extend : 'PolicyWeb.model.Netspoc',
        //extend : 'Ext.data.Model',
        fields      : [
            { name : 'name' },
            { name : 'alias',
              mapping : function(node) {
                  return node.alias || node.name;
              },
              sortType : 'asUCString' 
            }
        ]
    }
);

