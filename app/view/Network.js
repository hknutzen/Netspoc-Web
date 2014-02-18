
Ext.define(
    'PolicyWeb.view.Network',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.networkview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildNetworkListPanel(),
                this.buildNetworkResourcesView()
            ];
            this.callParent(arguments);
        },
        
        buildNetworkListPanel : function() {
            var networklist = Ext.create(
                'PolicyWeb.view.panel.grid.Networks'
            );
            return {
                xtype          : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
                tbar : [
                    'Netzauswahl',
                    {
                        text         : 'Bestätigen',
                        iconCls      : 'icon-accept',
                        disabled     : true,
                        enableToggle : false
                    },
                    {
                        text         : 'Aufheben',
                        iconCls      : 'icon-cancel',
                        disabled     : true,
                        enableToggle : false
                    },
                    '->',
                    {
                        xtype   : 'printbutton',
                        tooltip : 'Druckansicht für die Liste der eigenen Netze'
                    }
                ],
                items     : [
                    networklist
                ]
            };
        },

        buildNetworkResourcesView : function() {
            return {
                xtype : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
                tbar : [
                    {
                        text          : 'Enthaltene Ressourcen',
                        toggleGroup   : 'containedResourcesGrp',
                        scope         : this,
                        handler       : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 0 );
                        }
                    },
                    '->',
                    {
                        xtype   : 'printbutton',
                        tooltip : 'Druckansicht für die Ressourcen der aktuell selektierten Netze'
                    }
                ],
                items : [
                    this.buildNetworkResources()
                ]
            };
        },

        buildNetworkResources : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.NetworkResources'
            );
        }
    }
);

