

Ext.define(
    'PolicyWeb.view.Viewport',
    {
	extend   : 'Ext.container.Viewport',
        alias    : 'widget.mainview',
	requires : [
            'PolicyWeb.view.Service',
            'PolicyWeb.view.Services',
            'PolicyWeb.view.OwnerCombo',
            'PolicyWeb.view.HistoryCombo'
	],
	layout   : 'fit',
        
	initComponent : function() {
            this.items = this.buildViewport();
            this.callParent(arguments);
        },


        buildOwnersStore : function(options) {
            var store = Ext.create(
                'PolicyWeb.store.Owner',
                {
                    autoLoad    : true,
                    proxyurl    : 'get_owners',
                    autoDestroy : true,
                    sortInfo    : { field: 'alias', direction: 'ASC' }
                }
            );
            if (options) {
                store = Ext.apply( store, options );
            }
            return store;
        },

        buildViewport : function () {

            var sv = Ext.create(
                'PolicyWeb.view.Service'
            );
            //debugger;
            var cardPanel = {
                xtype          : 'panel',
                layout         : 'card',
                activeItem     : 0,
                layoutConfig   : { deferredRender : true },
                border         : false,
                items          :  [
                    sv
/*,
                    {
                        xtype : 'serviceview'
                    }
                    // Index of items must be the same as
                    // index of buttons in toolbar below.
                    //{ xtype : 'policymanager'  },
                    //{ xtype : 'networkmanager' },
                    //{ xtype : 'diffmanager'    },
                    //{ xtype : 'accountmanager' }
*/                ],
                tbar   : [
                    {
                        text         : 'Dienste, Freischaltungen',
                        iconCls      : 'icon-chart_curve',
                        toggleGroup  : 'navGrp',
                        enableToggle : true,
                        pressed      : true,
                        scope        : this,
                        handler      : this.switchToCard
                    },
                    {
                        text         : 'Eigene Netze',
                        iconCls      : 'icon-computer_connect',
                        toggleGroup  : 'navGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : this.switchToCard
                    },
                    {
                        text         : 'Diff',
                        iconCls      : 'icon-chart_curve_edit',
                        toggleGroup  : 'navGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : this.switchToCard
                    },
                    {
                        text         : 'Berechtigungen',
                        iconCls      : 'icon-group',
                        toggleGroup  : 'navGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : this.switchToCard
                    },
                    '->',
                    'Stand',
                    //this.buildHistoryCombo(historyStore),
                    { xtype : 'historycombo' },
                    ' ',
                    'Verantwortungsbereich',
                    //this.buildOwnerCombo(this.buildOwnersStore()),
                    { xtype : 'ownercombo' },
                    ' ',
                    'Abmelden',
                    {
                        iconCls : 'icon-door_out',
                        scope   : this,
                        handler : this.fireLogoutEvent
                    }
                ]
            };
            return cardPanel;
	},
        
        fireLogoutEvent : function() {
            this.fireEvent( 'logout' );
        },

        switchToCard : function( button ) {
            var index     = button.ownerCt.items.indexOf(button);
            var cardPanel = button.findParentByType('panel');
            cardPanel.layout.setActiveItem( index );
        },

        buildHistoryCombo : function (store) {
            var combo = Ext.create(
                'PolicyWeb.view.HistoryCombo', {
                    xtype     : 'historycombo',
                    store     : 'History',
                    // Show initially selected history (i.e curent version).
                    value     : appstate.showHistory(),
                    listeners : {
                        scope  : this,
                        // Delete the previous query in the beforequery event.
                        // This will reload the store the next time it expands.
                        beforequery : function(qe){
                            var combo = qe.combo;
                            delete combo.lastQuery;
                            combo.getStore().needLoad = false;
                        },
                        select : function (combo, record, index) {
                            appstate.changeHistory(record);
                            combo.setValue(appstate.showHistory());
                        }
                    }
                }
            );
            appstate.addListener(
                'ownerChanged', 
                function () {
                    var store = this.getStore();
                    this.setValue(appstate.showHistory()); 
                    store.needLoad = true; 
                }, 
                combo);
            return combo;
        }
    }
);