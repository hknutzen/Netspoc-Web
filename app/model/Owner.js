
Ext.define(
    'PolicyWeb.model.Owner',
    {
        extend : 'PolicyWeb.model.Netspoc',
        //extend : 'Ext.data.Model',
        fields      : [
            { name : 'name',
              sortType : 'asUCString' 
            }
        ]
    }
);

