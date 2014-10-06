

Ext.define(
    'PolicyWeb.store.Emails',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Email',
        autoLoad : false,
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_emails'
        }
    }
);
