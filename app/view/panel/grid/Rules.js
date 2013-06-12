
Ext.define(
    'PolicyWeb.view.panel.grid.Rules',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.servicerules',
        controllers : [ 'Service' ],
        store       : 'Rules',
        forceFit    : true,
        flex        : 2,
        border      : false,
        columns     : [
            {
                header    : 'Aktion',
                dataIndex : 'action',
                flex      : 2,
                fixed     : true
            },
            {
                header    : 'Quelle',
                flex      : 5,
                dataIndex : 'src'
            },
            {
                header    : 'Ziel',
                flex      : 5,
                dataIndex : 'dst'
            },
            {
                header    : 'Protokoll',
                flex      : 2,
                dataIndex : 'prt'
            }
        ],
        defaults : {
            menuDisabled : true
        }
    }
);

