

Ext.define(
    'PolicyWeb.view.Viewport',
    {
	extend   : 'Ext.container.Viewport',
	requires : [
            'PolicyWeb.view.Policy'
            //'PolicyWeb.view.Ressources',
	],
	layout   : 'fit',

	initComponent: function() {

            var historyStore = Ext.create( 
                {
                    xtype      : 'netspocstatestore',
                    storeId    : 'historyStore',
                    proxyurl   : 'get_history',
                    autoDestroy: true,
                    fields     : [ 'policy', 'date', 'time', 'current' ],
                    // Own option, used in combo box of diffmanager.
                    needLoad   : true
                }
            );
            var cardPanel = {
                xtype          : 'panel',
                layout         : 'card',
                activeItem     : 0,
                layoutConfig   : { deferredRender : true },
                border         : false,
                items          :  [
                    {
                        xtype : 'policygrid'
                    }
/*,
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
                    this.buildHistoryCombo(historyStore),
                    ' ',
                    'Verantwortungsbereich',
                    //this.buildOwnerCombo(this.buildOwnersStore()),
                    ' ',
                    'Abmelden',
                    {
                        iconCls : 'icon-door_out',
                        scope   : this,
                        handler : this.onLogout
                    }
                ]
            };
            this.items = [
		{
		    layout : 'border',
		    items  : [
			cardPanel
		    ]
		}
	    ];
            this.callParent();
	},

        switchToCard : function( button ) {
            var index     = button.ownerCt.items.indexOf(button);
            var cardPanel = button.findParentByType('panel');
            cardPanel.layout.setActiveItem( index );
        },

        buildHistoryCombo : function (store) {
            var appstate = PolicyWeb.app.globals.appstate;
            var combo = Ext.create(
                {
                    xtype          : 'historycombo',
                    store          : store,
                    
                    // Show initially selected history (i.e curent version).
                    value          : appstate.showHistory(),
                    listeners: {
                        scope  : this,
                        // Delete the previous query in the beforequery event.
                        // This will reload the store the next time it expands.
                        beforequery: function(qe){
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