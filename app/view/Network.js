
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
            var routerpanel = {
            };
            return {
                xtype          : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
                tbar : [
                    {
                        text         : 'Netze',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
                        pressed      : true,
                        scope        : this,
                        handler      : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 0 );
                            var active = cardPanel.layout.activeItem;
                            active.loadStoreByParams( {} );
                        }
                    },
                    {
                        text         : 'Router',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 1 );
                        }
                    },
                    {
                        text         : 'Netzauswahl',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : this.createAndShowNetworkChooser
                    },
                    '->',
                    {
                        xtype : 'printbutton'
                    }
                ],
                items     : [
                    networklist,
                    routerpanel
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
                        xtype : 'printbutton'
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

