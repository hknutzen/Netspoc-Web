
Ext.define(
    'PolicyWeb.view.panel.grid.Supervisors',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.supervisorlist',
        controllers : [ 'Account' ],
        store       : 'Supervisors',
        border      : true,
        hideHeaders : true,
        flex        : 1,
        title       : 'Übergeordnet',
        columns     : {
            items : [
                { dataIndex : 'alias'    }
            ]
        }
    }
);

