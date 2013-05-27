
Ext.define(
    'PolicyWeb.view.ServiceList',
    {
        extend      : 'Ext.grid.Panel',
        alias       : 'widget.servicelist',
        controllers : [ 'Service' ],
        store       : 'ServiceList',
        forceFit    : true,
        flex        : 2,
        border      : false,
        columns     : {
            items : [
                { text : 'Dienstname',  dataIndex : 'name' }
            ],
            defaults : {
                flex : 1,
                menuDisabled : true
            }
        },
        tbar        : [
            {
                text         : 'Eigene',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'owner'
            },
            {
                text         : 'Genutzte',
                toggleGroup  : 'polNavBtnGrp',
                pressed      : true,
                enableToggle : true,
                relation     : 'user'
            },
            {
                text         : 'Nutzbare',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'visible'
            },
            {
                text         : 'Alle',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : undefined,
                storeParams  : {}
            },
            {
                text         : 'Suche',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                allowDepress : false
            },
            '->',
            {
                iconCls : 'icon-eye',
                tooltip : 'Weitere (druckbare) Ansichten öffnen',
                scope   : this
                //handler : this.displayPrintWindow
            }
        ]
    }
);

