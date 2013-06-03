var search_window;
var print_window;

Ext.define(
    'PolicyWeb.controller.Service', {
        extend : 'Ext.app.Controller',
        views  : [ 'panel.grid.Services', 'panel.form.ServiceDetails' ],
        models : [ 'Service' ],
        stores : [ 'Service', 'Rules', 'Users' ],
        refs   : [
            {
                selector : 'servicelist',
                ref      : 'servicesGrid'
            },
            {
                selector : 'servicedetails',
                ref      : 'serviceDetailsForm'
            },
            {
                selector : 'servicedetails > fieldcontainer > button',
                ref      : 'ownerTrigger'
            },
            {
                selector : 'servicedetails > fieldcontainer > textfield',
                ref      : 'ownerTextfield'
            },
            {
                selector : 'servicedetails > fieldcontainer',
                ref      : 'ownerField'
            },
            {
                selector : '#ownerEmails',
                ref      : 'ownerEmails'
            },
            {
                selector : '#userEmails',
                ref      : 'userDetailEmails'
            },
            {
                selector : 'serviceusers',
                ref      : 'serviceUsersView'
            },
            {
                selector : 'serviceview cardprintactive',
                ref      : 'detailsAndUserView'
            },
            {
                selector : 'searchwindow > form',
                ref      : 'searchFormPanel'
            },
            {
                selector : 'searchwindow > form button',
                ref      : 'startSearchButton'
            }
        ],

        init : function() {
            this.control(
                {
                    'serviceview > servicelist' : {
                        select : this.onServiceSelected
                    },
                    'serviceusers' : {
                        select : this.onUserDetailsSelected
                    },
                    'servicedetails button' : {
                        click  : this.onTriggerClick
                    },
                    'serviceview > grid button' : {
                        click  : this.onButtonClick
                    },
                    'searchwindow > form button' : {
                        click  : this.onStartSearchButtonClick
                    },
                    'searchwindow > form textfield' : { 
                        specialkey  : this.onSearchWindowSpecialKey
                    },
                    'serviceview cardprintactive :not(printbutton)' : {
                        click  : this.onServiceDetailsButtonClick
                    }                    
                }
            );
            // Listen for application-wide events.
            this.application.on(
                {
                    some_event : this.doSth,
                    scope      : this
                }
            );

        },

        onLaunch : function () {

            var store = this.getServiceStore();
            store.on( 'load',
                      function () {
                          var g = this.getServicesGrid();
                          if ( g.getStore().getCount() > 0 ) {
                              var selmodel = g.getSelectionModel();
                              selmodel.select(0);
                          }
                      },
                      this
                    );

            var userstore = this.getUsersStore();
            userstore.on( 'load',
                      function () {
                          var u = this.getServiceUsersView();
                          if ( u.getStore().getCount() > 0 ) {
                              var selmodel = u.getSelectionModel();
                              selmodel.select(0);
                          }
                      },
                      this
                    );

            appstate.addListener(
                'changed', 
                function () {
                    store.getProxy().extraParams.relation = 'user';
                    store.load();
                },
                this
            );
            
            this.displaySearchWindow();
        },
        
        onServiceSelected : function( rowmodel, service, index, eOpts ) {
            // Load details, rules and emails of owners
            // for selected service.
            if (! service) {
                this.clearDetails();
                return;
            }

            // Merge delegated owner and (multiple) std. owners.
            var sub_owner = service.get( 'sub_owner' );
            var array = service.get( 'owner' );
            var all_owners;
            if (sub_owner) {
                sub_owner.sub_owner = true;
                all_owners = [];
                all_owners = all_owners.concat(sub_owner, array);
            }
            else {
                all_owners = array;
            }
            service.set('all_owners', all_owners);

            // Load details form with values from selected record.
            var form = this.getServiceDetailsForm();
            form.loadRecord( service );

            // Handle multiple owners.
            var trigger = this.getOwnerTrigger();
            if (all_owners.length == 1) {
                // Hide trigger button if only one owner available.
                trigger.hide();
            }
            else {
                // Multiple owners available.
                trigger.show();
            }
            trigger.ownerCt.doLayout();
            // Show emails for first owner. Sets "owner1"-property
            // displayed as owner, too.
            this.onTriggerClick(); // manually call event handler

            // Load rules.
            var name  = service.get( 'name' );
            var store = this.getRulesStore();
            store.getProxy().extraParams.service = name;
            store.load();

            // Load users.
            store = this.getUsersStore();
            store.getProxy().extraParams.service = name;
            store.load();
        },
        
        onTriggerClick : function() {
            var owner_field = this.getOwnerField();
            var owner_text  = this.getOwnerTextfield();
            var formpanel   = this.getServiceDetailsForm();
            var form   = formpanel.getForm();
            var record = form.getRecord();
            var array  = record.get( 'all_owners' );
            var owner1 = array.shift();
            var name   = owner1.name;
            var alias  = owner1.alias || name;
            array.push(owner1);
            owner_field.setFieldLabel(
                owner1.sub_owner ? 'Verwalter:' : 'Verantwortung:');
            owner_text.setValue( alias );
            var emails = this.getOwnerEmails();
            emails.show( name, alias );
        },

        clearDetails : function() {
            var formpanel = this.getServiceDetailsForm();
            var form      = formpanel.getForm();
            var trigger   = this.getOwnerTrigger();
            form.reset();
            trigger.hide();
            trigger.ownerCt.doLayout();
            this.getRulesStore().removeAll();
            this.getUsersStore().removeAll();
            this.getOwnerEmails().clear();
            this.getUserDetailEmails().clear();
        },

        onButtonClick : function( button, event, eOpts ) {
            if ( button.text === 'Suche' ) {
                this.displaySearchWindow();
                return;
            }
            var relation = button.relation || '';
            var store    = this.getServiceStore();
            var proxy    = store.getProxy();
            var grid     = this.getServicesGrid();
            // Don't reload store if button clicked on is the one
            // that was already selected.
            if ( relation && relation === proxy.extraParams.relation ) {
                return;
            }
            proxy.extraParams.relation = relation;
            store.load();
            this.clearDetails();
        },

        onStartSearchButtonClick : function( button, event, eOpts ) {
            var form = this.getSearchFormPanel().getForm();
            if ( form.isValid() ) {
                button.search_params = form.getValues();
                var store      = this.getServiceStore();
                var relation   = button.relation;
                var params     = button.search_params;
                var keep_front = false;
            
                if ( params ) {
                    keep_front = params.keep_front;
                }
                if ( search_window && !keep_front ) {
                    search_window.hide();
                }
                if ( print_window ) {
                    print_window.hide();
/*
                    // Find services-and-rules-window and close it.
                    var wnd = Ext.WindowMgr.get( 'srvRulesWndId' );
                    if ( wnd ) {
                        wnd.close();
                    }
*/
                }
                if ( relation && relation === store.baseParams.relation) {
                    return;
                }
                store.load(
                    {
                        params   : params,
                        relation : relation
                    }
                );
                this.clearDetails();
            } else {
                var m = 'Bitte Eingaben in rot markierten ' +
                    'Feldern korrigieren.';
                Ext.MessageBox.alert( 'Fehlerhafte Eingabe!', m );
            }
        },
        
        onServiceDetailsButtonClick : function( button, event, eOpts ) {
            var card  = this.getDetailsAndUserView();
            var index = button.ownerCt.items.indexOf(button);
            if ( index === 2 ) {
                index = index - 1;
            }
            else {
                this.onTriggerClick();
            }
            card.layout.setActiveItem( index );
        },

        onUserDetailsSelected : function( rowmodel, user_item ) {
            var owner = '';
            var owner_alias = '';
            var email_panel = this.getUserDetailEmails();
            if ( user_item ) {
                owner       = user_item.get('owner');
                owner_alias = user_item.get('owner_alias');
            }
            // Email-Panel gets cleared on empty owner.
            email_panel.show( owner, owner_alias );
        },

        onSearchWindowSpecialKey : function( field, e ){
            // Handle ENTER key press in search textfield.
            if ( e.getKey() == e.ENTER ) {
                var sb = this.getStartSearchButton();
                sb.fireEvent( 'click' );
            }
        },
        
        displaySearchWindow : function() {
            if ( !search_window ) {
                search_window = Ext.create(
                    'PolicyWeb.view.window.Search'
                );
                search_window.on( 'show', function () {
                                      search_window.center();
                                      var t = search_window.query('textfield');
                                      t[0].focus( true, 20 );
                                  }
                                );
            }
            search_window.show();
        },

        displayPrintWindow : function() {
        },

        doSth : function( button, event, eOpts ) {
        }
    }
);