

Ext.define(
    'PolicyWeb.store.Service',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Service',
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
