

Ext.define(
    'PolicyWeb.store.SupervisorEmails',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.SupervisorEmails',
        autoLoad : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_admins_watchers'
        }
    }
);
