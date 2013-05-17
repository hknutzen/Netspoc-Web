
// Main file that launches application.
Ext.Loader.setConfig(
    {
        enabled        : true,
        paths          : {
            'PolicyWeb' : './app'
        }
        //disableCaching : false
    }
);

Ext.require( [
                 'PolicyWeb.store.ServiceList',
                 'PolicyWeb.store.Netspoc',
                 'PolicyWeb.store.NetspocState',
                 'PolicyWeb.store.History',
                 'PolicyWeb.store.Owner',
                 'PolicyWeb.store.Test',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.Service'
             ]
           );

Ext.application(
    {
	name               : 'PolicyWeb',
        appFolder          : './app',
	autoCreateViewport : true,
	models             : [ 'Netspoc', 'ServiceList', 'Owner' ],
	stores             : [ 'Netspoc', 'NetspocState', 'ServiceList',
                               'Owner', 'History' ],
	controllers        : [ 'Main', 'Service' ],
        //views              : [ 'Service', 'ServiceList', 'HistoryCombo' ],
	launch             : function() {
            this.getActiveOwner();
        },
        
        getActiveOwner : function() {
            var store = Ext.create(
                'PolicyWeb.store.Owner', {
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
            store.load(
                {
                    scope    : this,
                    store    : store,
                    callback : function(records, options, success) {
                        // Keep already selected owner.
                        if (success && records.length) {
                            var owner = records[0].get('name');
                            var alias = records[0].get('alias');
                            this.setOwnerState({ name  : owner, 
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
                    }
                }
            );
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

        setOwner : function(owner, alias) {
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

        getCurrentPolicy : function(owner_obj) {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl    : 'get_policy',
                    autoDestroy : true,
                    fields      : [ 'policy', 'date', 'time', 'current' ]
                }
            );
            store.load(
                { scope    : this,
                  // Make store and owner available for callback.
                  store    : store, 
                  owner    : owner_obj,
                  callback : this.onPolicyLoaded
                }
            );
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
            //this.add( this.buildViewport() );
        }


    }
);

