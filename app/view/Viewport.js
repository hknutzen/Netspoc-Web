

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
            //this.buildViewport();
            //this.callParent();
            this.getActiveOwner();
        },

        getActiveOwner : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc', {
                    proxyurl    : 'get_owner',
                    autoDestroy : true,
                    fields      : [ 'name',
                                    { name : 'alias',
                                      
                                      // Take name, if no alias available.
                                      mapping : function(node) {
                                          return node.alias || node.name;
                                      },
                                      sortType : 'asUCString' 
                                    } 
                                  ]
                }
            );
            store.load({ scope    : this,
                         store    : store,
                         callback : function(records, options, success) {
                             // Keep already selected owner.
                             if (success && records.length) {
                                 var owner = records[0].get('name');
                                 var alias = records[0].get('alias');
                                 this.setOwnerState({ name : owner, 
                                                      alias : alias });
                             }
                             // Owner was never selected, 
                             // check number of available owners.
                             else {
                                 var store = this.buildOwnersStore( 
                                     { autoLoad : true }
                                 );
                                 store.load({ callback : this.onOwnerLoaded,
                                              scope    : this,
                                              store    : store
                                            });
                             }
                             options.store.destroy();
                         }});
        },

        onOwnerLoaded : function(records, options, success) {
            if (! success) {
                return;
            }
            // Automatically select owner if only one is available.
            if (records.length === 1) {
                var owner = records[0].get('name');
                var alias = records[0].get('alias');
                this.setOwner(owner, alias);
            }
            // Ask user to select one owner.
            else {
                var combo = this.buildOwnerCombo(options.store);
                new Ext.Window(
                    {
                        id       : 'ownerWindow',
                        title    : 'Verantwortungsbereich ausw&auml;hlen',
                        width    : 400, 
                        height   : 80,
                        layout   : 'fit', 
                        items    : [
                            {
                                xtype  : 'panel',
                                frame  : true,
                                layout : {
                                    type    : 'fit',
                                    padding : '5',
                                    align   : 'center'
                                },
                                items : combo
                            }
                        ]
                    }
                ).show();
            }
        },
        buildOwnersStore : function(options) {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    autoLoad    : true,
                    proxyurl    : 'get_owners',
                    autoDestroy : true,
                    sortInfo    : { field: 'alias', direction: 'ASC' },
                    fields      : [ { name : 'name' },
                                   { name : 'alias',
                                     mapping : function(node) {
                                         return node.alias || node.name;
                                     },
                                     sortType : 'asUCString' 
                                   }
                                 ]
                }
            );
            if (options) {
                store = Ext.apply( store, options );
            }
            return store;
        },
        buildOwnerCombo : function(store) {
            var config = {
                xtype          : 'combo',
                id             : 'cbOwnerId',
                forceSelection : true, 
                autoselect     : true,
                editable       : true,
                allowblank     : false,
                selectOnFocus  : true,
                typeAhead      : true,
                minChars       : 1,
                displayField   : 'alias',
                valueField     : 'name',
                loadingText    : 'Abfrage l&auml;uft ...',
                mode           : 'local',
                store          : store,
                triggerAction  : 'all',
                listWidth      : 400,

                // Show active owner.
                value          : appstate.getOwnerAlias(),
                listeners:{
                    scope    : this,
                    'select' : this.onOwnerChosen
                }
                
            };
            return config;
        },
        onOwnerChosen : function() {
            var combo = Ext.getCmp( 'cbOwnerId' );
            var owner = combo.getValue();
            var store, alias;
            if (appstate.getOwner() === owner) {
                return;
            }

            // Get alias name as well
            store = combo.store;
            alias = 
                store.getAt(store.findExact('name', owner)).get('alias');
            this.setOwner(owner, alias);
        },
        setOwner : function(owner, alias) {
            console.log( 'SET OWNER' );
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl : 'set',
                    fields   : [],
                    autoDestroy : true
                }
            );
            store.load({ params   : { owner : owner },
                         callback : this.onSetOwnerSuccess,
                         scope    : this,

                         // private option
                         owner    : {  name : owner, alias : alias }
                       });
        },
        onSetOwnerSuccess : function(records, options, success) {
            var owner_obj = options.owner;
            var window = Ext.getCmp( 'ownerWindow' );

            // Close window late, otherwise we get some extjs error.
            if (window) {
                window.close();
            }
            this.setOwnerState(owner_obj);
        },
        setOwnerState : function(owner_obj) {
            // Call appstate.changeOwner later, after history has been set.
            this.getCurrentPolicy(owner_obj);            
        },
        getCurrentPolicy : function(owner_obj) {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl : 'get_policy',
                    autoDestroy: true,
                    fields     : [ 'policy', 'date', 'time', 'current' ]
                }
            );
            store.load({ scope    : this,
                         // Make store and owner available for callback.
                         store    : store, 
                         owner    : owner_obj,
                         callback : this.onPolicyLoaded
                       });
        },
        onPolicyLoaded : function(records, options, success) {
            var owner_ob = options.owner;
            var record;
            if (success && records.length) {
                record = records[0];
                // Don't fire change event.
                appstate.changeHistory(record, true);
            }
            appstate.changeOwner(owner_ob.name, owner_ob.alias);
            options.store.destroy();
            this.buildViewport();
        },


        onLogout : function() {
            this.doLogout();
        },
        
        doLogout : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl : 'logout',
                    fields   : [],
                    autoDestroy : true
                }
            );
            store.load({ params   : {},
                         callback : this.onAfterLogout,
                         scope    : this
                       });
        },

        onAfterLogout : function() {

            // Jump to login page,
            // which is assumed to be the default page in current directory.
            window.location.href = '.';
        },

        buildViewport : function () {
            // Must be instantiated early, because this store is used
            // - in toolbar of cardpaned and
            // - in toolbar of diffmanager.
            var historyStore = Ext.create(
                'PolicyWeb.store.NetspocState',
                {
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
//                    {
//                        xtype : 'policygrid'
//                    }
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
                    //this.buildHistoryCombo(historyStore),
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
            return this;
	},

        switchToCard : function( button ) {
            var index     = button.ownerCt.items.indexOf(button);
            var cardPanel = button.findParentByType('panel');
            cardPanel.layout.setActiveItem( index );
        },

        buildHistoryCombo : function (store) {
            console.log( 'BUILDHISTORYCOMBO:' );
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