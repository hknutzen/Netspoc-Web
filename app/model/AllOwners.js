
Ext.define(
    'PolicyWeb.model.AllOwners',
    {
        extend : 'PolicyWeb.model.Base',

        fields : [
            {
                name : 'name',
                type : 'string'
            }
        ],
        proxy : {
            url : 'backend/get_owners'
        }
    }
);

