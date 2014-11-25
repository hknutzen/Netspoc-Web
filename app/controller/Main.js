/*
(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>
            Heinz Knutzen     <heinz.knutzen@gmail.com>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

Ext.define(
    'PolicyWeb.controller.Main', {
        extend : 'Ext.app.Controller',
        views  : [ 'Viewport', 'Service', 'Network' ],
        stores : [ 'Owner', 'AllOwners', 'History',
                   'CurrentPolicy', 'DiffGetMail',
                   'Service'
                 ],
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
                    'messagebox[title="Sitzung abgelaufen"] button': {
                        click        : this.onSessionTimeout
                    },
                    'mainview panel button[toggleGroup="navGrp"]': {
                        click        : this.onNavButtonClick
                    },
                    'ownercombo' : {
                        select       : this.onOwnerSelected
                    },
                    'mainview > panel > toolbar > historycombo' : {
                        select       : this.onPolicySelected,
                        beforequery  : function(qe){
                            var combo = qe.combo;
                            var store = combo.getStore();
                            delete combo.lastQuery;
                            store.needLoad = false;
                            store.reload();
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

	onSessionTimeout : function( button, event ) {
            if ( button.getText() === 'OK' ) {
                this.onLogout();
            }
        },

	onLaunch : function() {   
             appstate.setInitPhase( true );

            // Determine owner.
            var ownerstore = this.getOwnerStore();
            ownerstore.on( 'load', this.onOwnerLoaded, this );
            // Load owner store AFTER the store of the combo box
            // (AllOwners) was loaded. Otherwise the combo box will
            // be empty in IE.
            var oc = this.getOwnerCombo();
            oc.getStore().on(
                'load', function() {
                    ownerstore.load();
                }
            );

            // History gets loaded later, after owner is set ...
            var hist_store = this.getHistoryStore();
            hist_store.on( 'load',
                      function () {
                          var combo = this.getMainHistoryCombo();
                          combo.setValue( appstate.showHistory() );
                      },
                      this
                    );
        },

        onOwnerLoaded : function(store, records, success) {
            var owner, alias;
            // Keep already selected owner.
            if (success && records.length) {
                owner = records[0].get('name');
                alias = records[0].get('alias');
                this.setOwnerState({ name  : owner, 
                                     alias : alias });
            }
            // Owner was never selected, 
            // check number of available owners.
            else {
                var all_owners_store = this.getAllOwnersStore();
                var all_owners = all_owners_store.getRange();
                // Automatically select owner if only one is available.
                if ( all_owners.length === 1 ) {
                    owner = all_owners[0].get('name');
                    alias = all_owners[0].get('alias');
                    this.setOwner( owner, alias );
                }
                // Ask user to select one owner.
                else {
                    this.showSelectOwnerWindow();
                }
            }
        },

        showSelectOwnerWindow : function() {
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
            var store = this.getCurrentPolicyStore();
            store.load(
                {
                    scope    : this,
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
        
        onPolicyLoaded : function( records, options, success ) {
            var owner_ob = options.owner;
            if (success && records.length) {
                appstate.changeHistory(
                    records[0],
                    true   // Don't fire change event.
                );
            }
            appstate.changeOwner(owner_ob.name, owner_ob.alias);
            
            appstate.setInitPhase( false );

            // Set combo without loading the store.
            var ownercombo = this.getOwnerCombo();
            ownercombo.setValue( appstate.getOwnerAlias() );
            var historycombo = this.getMainHistoryCombo();
            historycombo.setValue( appstate.showHistory() );

            // Take search and other params into account when
            // loading service-store.
            var service_controller = this.getController( 'Service' );
            service_controller.loadServiceStoreWithParams();
        },
            
        onLogout : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxy       : {
                        type     : 'policyweb',
                        proxyurl : 'logout'
                    },
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