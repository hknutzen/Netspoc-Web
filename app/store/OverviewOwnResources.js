

Ext.define(
    'PolicyWeb.store.OverviewOwnResources',
    {
        extend     : 'PolicyWeb.store.NetspocState',
        model      : 'PolicyWeb.model.OverviewOwnResource',
        autoLoad   : false,
        proxy      : {
            type     : 'policyweb',
            proxyurl : 'get_own_resources'
        }
    }
);
