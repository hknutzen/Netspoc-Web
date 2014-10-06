

Ext.define(
    'PolicyWeb.store.Supervisors',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Supervisor',
        autoLoad : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_supervisors'
        }
    }
);
