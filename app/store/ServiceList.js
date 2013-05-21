

Ext.define(
    'PolicyWeb.store.ServiceList',
    {
        //extend    : 'Ext.data.Store',
        extend      : 'PolicyWeb.store.NetspocState',
        model       : 'PolicyWeb.model.ServiceList',
        controllers : [ 'Service' ],
        autoLoad    : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_history'
        }
    }
);
