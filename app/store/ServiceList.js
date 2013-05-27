

Ext.define(
    'PolicyWeb.store.ServiceList',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.ServiceList',
        autoLoad : false,
        sorters  : [
            {
                property  : 'name',
                direction : 'ASC'
            }
        ],
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'service_list'
        }
    }
);
