
Ext.define(
    'PolicyWeb.model.ServiceUser',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name     : 'name',
              sortType : 'asUCString' 
            }
        ]
    }
);

