
Ext.define(
    'PolicyWeb.model.ServiceUser',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name     : 'name',
              type     : 'string',
              sortType : 'asUCString' 
            }
        ],
        proxy  : {
            url : 'backend/service_users'
        }
    }
);

