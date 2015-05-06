

Ext.define(
    'PolicyWeb.store.Service',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Service',
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
            proxyurl : 'service_list'
        }
    }
);
