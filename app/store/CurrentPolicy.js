

Ext.define(
    'PolicyWeb.store.CurrentPolicy',
    {
        //extend   : 'PolicyWeb.store.Netspoc',
        extend   : 'Ext.data.Store',
        model    : 'PolicyWeb.model.History',
        autoLoad : false,
        proxy    : {
            type : 'ajax',
            url  : 'backend/get_policy',
            reader: {
                type: 'json',
                rootProperty: 'records'
            }
        }
    }
);
