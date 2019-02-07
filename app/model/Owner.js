
Ext.define(
    'PolicyWeb.model.Owner',
    {
        extend : 'PolicyWeb.model.Base',
        proxy  : {
            url : 'backend/get_owner'
        }
    }
);

