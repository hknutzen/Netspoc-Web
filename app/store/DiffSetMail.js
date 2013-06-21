

Ext.define(
    'PolicyWeb.store.DiffSetMail',
    {
        extend      : 'PolicyWeb.store.NetspocState',
        model       : 'PolicyWeb.model.Netspoc',
        autoLoad    : false,
        autoDestroy : true,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'set_diff_mail'
        }
    }
);
