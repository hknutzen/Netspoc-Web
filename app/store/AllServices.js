

Ext.define(
    'PolicyWeb.store.AllServices',
    {
        extend     : 'PolicyWeb.store.NetspocState',
        model      : 'PolicyWeb.model.AllService',
        autoLoad   : false,
        groupField : 'service',
        sorters    : [
            {
                property  : 'service',
                direction : 'ASC'
            }
        ],
        proxy      : {
            type     : 'policyweb',
            proxyurl : 'get_services_and_rules'
        }
    }
);
