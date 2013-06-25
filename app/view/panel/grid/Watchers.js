
Ext.define(
    'PolicyWeb.view.panel.grid.Watchers',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.watcherlist',
        controllers : [ 'Account' ],
        store       : 'Watchers',
        border      : true,
        hideHeaders : true,
        flex        : 1,
        title       : 'Zuschauer (Watcher)',
        columns     : {
            items : [
                { dataIndex : 'email'    }
            ]
        }
    }
);

