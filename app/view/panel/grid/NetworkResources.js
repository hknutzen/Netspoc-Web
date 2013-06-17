
Ext.define(
    'PolicyWeb.view.panel.grid.NetworkResources',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.networkresources',
        controllers : [ 'Network' ],
        store       : 'NetworkResources',
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

