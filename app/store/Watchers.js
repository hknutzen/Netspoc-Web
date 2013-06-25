

Ext.define(
    'PolicyWeb.store.Watchers',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Watcher',
        autoLoad : false,
        sorters  : [
            {
                property  : 'email',
                direction : 'ASC'
            }
        ],
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'get_watchers'
        }
    }
);
