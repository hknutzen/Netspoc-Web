

Ext.define(
    'PolicyWeb.store.CurrentPolicy',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.CurrentPolicy',
        autoLoad : false,
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_policy'
        }
    }
);
