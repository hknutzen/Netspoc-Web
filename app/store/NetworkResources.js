

Ext.define(
    'PolicyWeb.store.NetworkResources',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.NetworkResources',
        autoLoad : false,
        sorters  : [
            {
                property  : 'ip',
                direction : 'ASC'
            }
        ],
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_hosts'
        }
    }
);
