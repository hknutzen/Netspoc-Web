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

var global_theme_name = 'neptune';
var about_window;

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
                    'mainview panel button[iconCls="icon-info"]': {
                        click        : this.onMainInfoButtonClick
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
                    'initialownercombo' : {
                        select       : this.onOwnerSelected
                    },
                    'compatinfowindow button' : {
                        click : this.setCompatMsgMode
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

            if ( ie_compat_mode() === true ) {  // see common.js
                this.getCompatInfoMsgMode();
            }
        },

        getCompatInfoMsgMode : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.getProxy().setUrl('backend/get_compat_msg_mode');
            store.load(
                {
                    callback : this.showCompatInfoWindow,
                    scope    : this
                }
            );
        },

        showCompatInfoWindow : function( records ) {
            if ( records ) {
                var value = records[0];
                if ( value ) {
                    if ( value.raw.ignore_compat_msg == 'true' ) {
                        return false;
                    }
                }
            }
            this.displayCompatInfoWindow();
            return true;
        },

        displayCompatInfoWindow : function() {
            Ext.create(
                'PolicyWeb.view.window.CompatInfo'
            ).show();
        },

        setCompatMsgMode : function(button) {
            var window = button.up('window');
            var checkbox = window.down('checkboxfield');
            var value = checkbox.getValue();
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.getProxy().setUrl('backend/get_compat_msg_mode');
            store.load(
                {
                    params   : { ignore_compat_msg : value },
                    callback : function () {
                        window.close();
                    },
                    scope    : this
                }
            );
        },

        onOwnerLoaded : function(store, records, success) {
            var owner;
            // Keep already selected owner.
            if (success && records.length) {
                owner = records[0].get('name');
                this.setOwnerState({ name  : owner });
            }
            // Owner was never selected,
            // check number of available owners.
            else {
                var all_owners_store = this.getAllOwnersStore();
                var all_owners = all_owners_store.getRange();
                // Automatically select owner if only one is available.
                if ( all_owners.length === 1 ) {
                    owner = all_owners[0].get('name');
                    this.setOwner( owner );
                }
                // Ask user to select one owner.
                else {
                    this.showSelectOwnerWindow();
                }
            }
        },

        showSelectOwnerWindow : function() {
            var combo = Ext.create(
                'PolicyWeb.view.combo.InitialOwnerCombo'
            );
            var win = Ext.create(
                'Ext.window.Window',
                {
                    id          : 'win_owner',
                    title       : 'Verantwortungsbereich ausw&auml;hlen',
                    width       : 400,
                    height      : 80,
                    layout      : 'fit',
                    bodyPadding : 10,
                    items       : [ combo ]
                }
            ).show();
        },

        setOwner : function(owner) {
            Ext.Ajax.request(
                {
                    url     : 'backend/set',
                    params  : {
                        owner : {  name : owner }
                    },
                    scope   : this, // important for "this" to be defined in success handler!
                    success : this.onSetOwnerSuccess,
                    failure : this.onSetOwnerException
                }
            );
        },

        onSetOwnerException : function(connection, options, e_opts) {
            alert("Fehler beim Setzen des owners in der Session!");
        },

        onSetOwnerSuccess : function(response, options) {
            var obj = Ext.decode(response.responseText);
            var owner_obj = options.params.owner;
            var window = Ext.getCmp( 'win_owner' );

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
            if ( appstate.getOwner() === owner ) {
                return;
            }
            this.setOwner(owner);
        },

        onPolicyLoaded : function( records, options, success ) {
            var owner_ob = options.owner;
            if (success && records.length) {
                appstate.changeHistory(
                    records[0],
                    true   // Don't fire change event.
                );
            }
            appstate.changeOwner(owner_ob.name);

            appstate.setInitPhase( false );

            // Determine and remember if an admin or a watcher
            // is logged in.
            Ext.Ajax.request(
                {
                    url      : 'backend/admin_or_watcher',
                    //method   : 'POST',
                    params   : {
                        history      : appstate.getHistory(),
                        active_owner : appstate.getOwner()
                    },
                    success : function ( response ) {
                        var obj = Ext.decode( response.responseText );
                        if ( obj.data === 'admin' ) {
                            appstate.setAdmin( true );
                        }
                    },
                    failure : function ( response ) {
                        var msg = "Admin oder Watcher Status konnte nicht ermittelt werden. Bitte wenden Sie sich an die Administratoren von Policy-Web.";
                        Ext.MessageBox.show(
                            { title   : 'Fehler', 
                              msg     : msg,
                              buttons : Ext.MessageBox.OK,
                              icon    : Ext.MessageBox.ERROR
                            });
                    }
                }
            );


            // Set combo without loading the store.
            var ownercombo = this.getOwnerCombo();
            ownercombo.setValue( appstate.getOwner() );
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
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.getProxy().setUrl('backend/logout');
            store.load(
                { params   : {},
                  callback : this.onAfterLogout,
                  scope    : this
                }
            );
        },

        onMainInfoButtonClick : function() {
            if ( !about_window ) {
                about_window = Ext.create(
                    'PolicyWeb.view.window.About'
                );
                about_window.on( 'show', function () {
                                     about_window.center();
                                 }
                               );
            }
            if ( about_window.isHidden() ) {
                about_window.show();
            }
            else {
                about_window.hide();
            }
        },

        onAfterLogout : function() {

            // Jump to login page.
            window.location.href = document.referrer;
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
            this.closeAddUserObjectWindow();
            this.closeAddToRuleWindow();
            this.closeDeleteUserObjectWindow();
            this.closeDeleteFromRuleWindow();
        },

        closeSearchWindow : function( keep_open ) {
            if ( Ext.isObject( search_window ) ) {
                var service_controller = this.getController( 'Service' );
                var form = service_controller.getSearchFormPanel().getForm();
                var values = form.getValues();
                if ( values.keep_front !== 'on' ) {
                    search_window.close();
                }
            }
        },

        closeAddUserObjectWindow : function() {
            if ( Ext.isObject( add_user_window ) ) {
                add_user_window.close();
            }
        },

        closeDeleteUserObjectWindow : function() {
            if ( Ext.isObject( del_user_window ) ) {
                del_user_window.close();
            }
        },

        closeDeleteFromRuleWindow : function() {
            if ( Ext.isObject( del_from_rule_window ) ) {
                del_from_rule_window.close();
            }
        },

        closeAddToRuleWindow : function() {
            if ( Ext.isObject( add_to_rule_window ) ) {
                add_to_rule_window.close();
            }
        },

        closePrintWindow : function() {
            if ( Ext.isObject( print_window ) ) {
                print_window.close();
            }
        }
    }
);
