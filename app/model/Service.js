
Ext.define(
    'PolicyWeb.model.Service',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name     : 'name',
              sortType : 'asUCString' 
            },
            { name     : 'desc',
              mapping  : 'description' },
            { name : 'owner'     },
            { name : 'sub_owner' }
        ]
    }
);

