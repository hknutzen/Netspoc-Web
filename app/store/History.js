

Ext.define(
    'PolicyWeb.store.History',
    {
        //extend   : 'Ext.data.Store',
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.History',
        autoLoad : false,
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_history'
        }
    }
);
