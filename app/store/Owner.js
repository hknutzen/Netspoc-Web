

Ext.define(
    'PolicyWeb.store.Owner',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.Owner',
        autoLoad : false,
        proxy: {
            type: 'ajax',
            url: 'backend/get_owner',
            reader: {
                type: 'json',
                rootProperty: 'records'
            }
        }
/*
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_owner'
        }
*/
    }
);
