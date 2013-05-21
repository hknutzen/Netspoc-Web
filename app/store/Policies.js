

Ext.define(
    'PolicyWeb.store.Policies',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.Policies',
        autoLoad : false,
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_policy'
        }
    }
);
