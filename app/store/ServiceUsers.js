

Ext.define(
    'PolicyWeb.store.ServiceUsers',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.ServiceUser',
        autoLoad : false,
        pageSize : 100,
        sorters  : [
            {
                property  : 'name',
                direction : 'ASC'
            }
        ],
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'service_users'
        }
    }
);
