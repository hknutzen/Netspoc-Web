
Ext.define(
    'PolicyWeb.controller.Main', {
        extend : 'Ext.app.Controller',
        views  : [ 'Viewport' ],
        stores : [ 'Owner', 'AllOwners', 'History', 'Policies' ],
        refs   : [
            {
                selector : 'mainview',
                ref      : 'mainView'   
            },
            {
                selector : 'historycombo',
                ref      : 'historyCombo'   
            },
            {
                selector : 'ownercombo',
                ref      : 'ownerCombo'   
            }
        ],

        init: function() {
            
            this.control(
                {
                    'mainview': {
                        beforerender   : this.beforeViewportRendered,
                        logout         : this.onLogout
                    },
                    'ownercombo' : {
                        select         : this.onOwnerSelected
                    }
                }
            );

            // Handle application wide events.
            this.application.on(
                {
                    policyLoaded : this.onPolicyLoaded,
                    scope    : this
                }
            );
        },
        
/*
        onOwnerChosen : function() {
            var combo = Ext.getCmp( 'cbOwnerId' );
            var owner = combo.getValue();
            var store, alias;
            if (NetspocManager.appstate.getOwner() === owner) {
                return;
            }

            // Get alias name as well
            store = combo.store;
            alias = 
                store.getAt(store.findExact('name', owner)).get('alias');
            this.setOwner(owner, alias);
        },
        setOwner : function(owner, alias) {
            var store =  new NetspocWeb.store.Netspoc(
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

 */
        onOwnerSelected : function(  combo, records, eOpts ) {
            console.log( 'SELECTED OWNER ' + records[0].get( 'name' ) );
            var owner = combo.getValue();
            var store, alias;
            if ( appstate.getOwner() === owner ) {
                return;
            }

            // Get alias name as well
            store = combo.store;
            alias = 
                store.getAt(store.findExact('name', owner)).get('alias');
            //this.setOwner(owner, alias);
        },
        
        onPolicyLoaded : function() {
            var store = this.getAllOwnersStore();
            store.load();
            var ownercombo = this.getOwnerCombo();
            ownercombo.setValue( appstate.getOwnerAlias() );

            store = this.getPoliciesStore();
            store.load();
            var historycombo = this.getHistoryCombo();
            historycombo.setValue( appstate.showHistory() );
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

        beforeViewportRendered: function( view ) {
            //console.log('BEFORE The viewport is rendered');
            
        }
    }
);