
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
        features    : [
            {
                groupHeaderTpl    : '{name} ({[values.children.length]} Element{[(values.children.length) > 1 ? "e" : ""]})',
                ftype             : 'grouping',
                hideGroupedHeader : true
            }
        ],
        columns     : [
            { dataIndex : 'name' },
            { text : 'IP-Adresse',            dataIndex : 'child_ip'    },
            { text : 'Name',                  dataIndex : 'child_name'  },
            { text : 'Verantwortungsbereich', dataIndex : 'child_owner' }
        ]
    }
);

