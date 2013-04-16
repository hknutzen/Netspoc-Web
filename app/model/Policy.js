
Ext.define(
    'PolicyWeb.model.Policy',
    {
        extend : 'Ext.data.Model',
        fields : [ 'name' ],
        proxy  : {
            type : 'ajax',
            url  : '/daniel4/backend/return_data',
            reader : {
                type            : 'json',
                root            : 'records',
                totalProperty   : 'totalCount',
                successProperty : 'success'
            }
        }
    }
);

