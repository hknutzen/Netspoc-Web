

Ext.define(
    'PolicyWeb.store.AllOwners',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.AllOwners',
        autoLoad : true,
        proxy    : {
            type          : 'policyweb',
            proxyurl      : 'get_owners'
        }
    }
);
