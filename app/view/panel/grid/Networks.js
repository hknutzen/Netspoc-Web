
Ext.define(
    'PolicyWeb.view.panel.grid.Networks',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.networklist',
        controllers : [ 'Network' ],
        store       : 'Networks',
        forceFit    : true,
        flex        : 2,
        border      : false,
        columns     : {
            items : [
                { text : 'IP-Adresse',            dataIndex : 'ip'    },
                { text : 'Name',                  dataIndex : 'name'  },
                { text : 'Verantwortungsbereich', dataIndex : 'owner' }
            ]
        }
    }
);

