

Ext.define(
    'PolicyWeb.store.Users',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.User',
        autoLoad : false,
        sorters  : [
            {
                property  : 'ip',
                direction : 'ASC'
            }
        ],
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_users'
        }
    }
);
