

Ext.define(
    'PolicyWeb.store.AllOwners',
    {
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.AllOwners',
        autoLoad : true,
        sorters  : 'alias',
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_owners'
        }
    }
);
