
Ext.define(
    'PolicyWeb.view.ServiceList',
    {
        extend      : 'Ext.grid.Panel',
        alias       : 'widget.servicelist',
        requires    : [ 'PolicyWeb.store.ServiceList',
                        'PolicyWeb.view.Service'
                     ],
        controllers : [ 'Service' ],
        //store       : 'ServiceList',

        initComponent : function() {
            this.callParent();            
        },

        flex        : 1,
        border      : false,
        columns     : [
            { text : 'DName',  dataIndex : 'name' }
        ],
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

