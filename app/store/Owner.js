

Ext.define(
    'PolicyWeb.store.Owner',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.Owner',
        autoLoad : false,
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_owner'
        }
    }

);
