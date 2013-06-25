
Ext.define(
    'PolicyWeb.controller.Main', {
        extend : 'Ext.app.Controller',
        views  : [ 'Viewport', 'Service', 'Network' ],
        stores : [ 'Owner', 'AllOwners', 'History',
                   'CurrentPolicy', 'DiffGetMail' ],
        refs   : [
            {
                selector : 'mainview',
                ref      : 'mainView'   
            },
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'   
            },
            {
                selector : 'mainview historycombo',
                ref      : 'mainHistoryCombo'   
            },
            {
                selector : 'ownercombo',
                ref      : 'ownerCombo'   
            }
        ],

        init : function() {
            
            this.control(
                {
                    'mainview': {
                        logout       : this.onLogout
                    },
                    'mainview panel button[toggleGroup="navGrp"]': {
                        click : this.onNavButtonClick
                    },
                    'ownercombo' : {
                        select       : this.onOwnerSelected
                    },
                    'mainview > panel > toolbar > historycombo' : {
                        select       : this.onPolicySelected,
                        beforequery  : function(qe){
                            var combo = qe.combo;
                            delete combo.lastQuery;
                            combo.getStore().needLoad = false;
                        }
                    }
                }
            );

            // Handle application wide events.
            this.application.on(
/*
                {
                    policyLoaded : this.onPolicyLoaded,
                    scope    : this
                }
*/
            );
        },

	onLaunch : function() {
            var store = this.getOwnerStore();
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
                            var store = this.getAllOwnersStore();
                            store.load(
                                { callback : this.onOwnerLoaded,
                                  autoLoad : true,
                                  scope    : this,
                                  store    : store
                                }
                            );
                        }
                    }
                }
            );
            store = this.getHistoryStore();
            store.on( 'load',
                      function () {
                          var combo = this.getMainHistoryCombo();
                          var h = appstate.showHistory();
                          combo.setValue( h );
                      },
                      this
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
                var combo = Ext.create(
                    'PolicyWeb.view.combo.OwnerCombo'
                );
                var win = Ext.create(
                    'Ext.window.Window',
                    {
                        id          : 'ownerWindow',
                        title       : 'Verantwortungsbereich ausw&auml;hlen',
                        width       : 400, 
                        height      : 80,
                        layout      : 'fit',
                        bodyPadding : 10,
                        items       : [ combo ]
                    }
                ).show();
            }
        },

        setOwner : function(owner, alias) {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxy       : {
                        type     : 'policyweb',
                        proxyurl : 'set'
                    },
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.load(
                { params   : { owner : owner },
                  callback : this.onSetOwnerSuccess,
                  scope    : this,
                  
                  // private option
                  owner    : {  name : owner, alias : alias }
                }
            );
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
            var store = this.getCurrentPolicyStore();
            store.load(
                { scope    : this,
                  // Make store and owner available for callback.
                  store    : store, 
                  owner    : owner_obj,
                  callback : this.onPolicyLoaded
                }
            );
        },
        
        onPolicySelected : function(  combo, records, eOpts ) {
            appstate.changeHistory(records[0]);
            combo.setValue(appstate.showHistory());
        },

        onOwnerSelected : function(  combo, records, eOpts ) {
            var owner = combo.getValue();
            var store, alias;
            if ( appstate.getOwner() === owner ) {
                return;
            }

            // Get alias name as well
            store = combo.store;
            alias = 
                store.getAt(store.findExact('name', owner)).get('alias');
            this.setOwner(owner, alias);
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

            var ownercombo = this.getOwnerCombo();
            ownercombo.setValue( appstate.getOwnerAlias() );

            // Load stores that need history to be set.
            this.getHistoryStore().load();
            this.getDiffGetMailStore().load();
        },
            
        onLogout : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl    : 'logout',
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.load(
                { params   : {},
                  callback : this.onAfterLogout,
                  scope    : this
                }
            );
        },

        onAfterLogout : function() {

            // Jump to login page,
            // which is assumed to be the default page in current directory.
            window.location.href = '.';
        },

        onNavButtonClick : function( button, event, eOpts ) {
            this.closeOpenWindows();
            var card  = this.getMainCardPanel();
            var index = button.ownerCt.items.indexOf(button);
            card.layout.setActiveItem( index );
        },

        closeOpenWindows : function() {
            this.closeSearchWindow();
            this.closePrintWindow();
        },

        closeSearchWindow : function() {
            if ( Ext.isObject( search_window ) ) {
                search_window.close();
            }
        },

        closePrintWindow : function() {
            if ( Ext.isObject( print_window ) ) {
                print_window.close();
            }
        }
    }
);