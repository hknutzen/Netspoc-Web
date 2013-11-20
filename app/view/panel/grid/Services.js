
Ext.define(
    'PolicyWeb.view.panel.grid.Services',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.servicelist',
        controllers : [ 'Service' ],
        store       : 'Service',
        border      : false,
        width       : 310,
        columns     : {
            items : [
                { text : 'Dienstname',  dataIndex : 'name' }
            ],
            defaults : {
                flex         : 1,
                menuDisabled : true
            }
        },
        tbar        : [
            {
                xtype        : 'chooseservice',
                text         : 'Eigene',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'owner'
            },
            {
                xtype        : 'chooseservice',
                text         : 'Genutzte',
                toggleGroup  : 'polNavBtnGrp',
                pressed      : true,
                enableToggle : true,
                relation     : 'user'
            },
            {
                xtype        : 'chooseservice',
                text         : 'Nutzbare',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'visible'
            },
            {
                text         : 'Suche',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'search',
                allowDepress : false
            },
            '->',
            {
                xtype : 'print-all-button'
            },
            {
                xtype : 'printbutton'
            }
        ]
    }
);

