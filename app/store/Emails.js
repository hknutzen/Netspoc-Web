

Ext.define(
    'PolicyWeb.store.Emails',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Email',
        autoLoad : false,
        sorters  : [
            {
                property  : 'email',
                direction : 'ASC'
            }
        ],
        proxy    : {
            type     : 'policyweb',
            proxyurl : 'get_emails'
        }
    }
);
