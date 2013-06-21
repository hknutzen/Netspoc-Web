

Ext.define(
    'PolicyWeb.store.DiffGetMail',
    {
        extend      : 'PolicyWeb.store.NetspocState',
        model       : 'PolicyWeb.model.Diff',
        autoLoad    : false,
        autoDestroy : true,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_diff_mail'
        }
    }
);
