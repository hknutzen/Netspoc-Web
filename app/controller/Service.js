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

var ip_search_tooltip;
var search_window;
var print_window;
var add_user_window;
var del_user_window;
var add_to_rule_window;
var del_from_rule_window;
var overview_window;
var graph_window;
var network_graph;
var cb_params_key2val = {
    'display_property' : {
        'true'  : 'name',
        'false' : 'ip'
    },
    'expand_users' : {
        'true'  : 1,
        'false' : 0
    },
    'filter_rules' : {
        'true'  : 1,
        'false' : 0
    }
};

Ext.define(
    'PolicyWeb.controller.Service', {
        extend : 'Ext.app.Controller',
        views  : [ 'panel.form.ServiceDetails' ],
        models : [ 'Service', 'Overview' ],
        stores : [ 'Service', 'AllServices', 'Rules', 'Users',
                   'SendNewUserTaskMail'
                 ],
        refs   : [
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'
            },
            {
                selector : 'servicelist',
                ref      : 'servicesGrid'
            },
            {
                selector : 'servicerules',
                ref      : 'rulesGrid'
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
                selector : 'serviceview  button[iconCls="icon-delete"]',
                ref      : 'deleteFromUserButton'
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
                selector : 'serviceview',
                ref      : 'serviceView'
            },
            {
                selector : 'serviceview cardprintactive',
                ref      : 'detailsAndUserView'
            },
            {
                selector : 'searchwindow > panel',
                ref      : 'searchCardPanel'   
            },
            {
                selector : 'adduserwindow > form',
                ref      : 'addUserFormPanel'
            },
            {
                selector : 'deluserwindow > form',
                ref      : 'delUserFormPanel'
            },
            {
                selector : 'addtorulewindow > form',
                ref      : 'addToRuleFormPanel'
            },
            {
                selector : 'delfromrulewindow > form',
                ref      : 'delFromRuleFormPanel'
            },
            {
                selector : 'searchwindow > form',
                ref      : 'searchFormPanel'
            },
            {
                selector : 'searchwindow > form > tabpanel',
                ref      : 'searchTabPanel'
            },
            {
                selector : 'chooseservice[pressed="true"]',
                ref      : 'chooseServiceButton'
            },
            {
                selector : 'serviceview > grid button[text="Suche"]',
                ref      : 'searchServiceButton'
            },
            {
                selector : 'searchwindow > form button[text="Suche starten"]',
                ref      : 'startSearchButton'
            },
            {
                selector : 'searchwindow > form checkboxgroup',
                ref      : 'searchCheckboxGroup'
            }
        ],

        init : function() {
            this.control(
                {
                    'serviceview > servicelist' : {
                        select : this.onServiceSelected
                    },
                    'servicerules' : {
                        printrules      : this.onPrintRules
                    },
                    'servicerules actioncolumn' : {
                        addobjecttorule      : this.onAddObjectToRule,
                        deleteobjectfromrule : this.onDeleteObjectFromRule
                    },
                    'serviceview button[iconCls=icon-add]' : {
                        click : this.onAddUserClick
                    },
                    'serviceview button[iconCls=icon-delete]' : {
                        click : this.onDeleteUserClick
                    },
                    'serviceusers' : {
                        select : this.onUserDetailsSelected
                    },
                    'servicedetails button' : {
                        click  : this.onTriggerClick
                    },
                    'serviceview checkbox' : {
                        change : this.onCheckboxChange
                    },
                    'serviceview > grid chooseservice' : {
                        click  : this.onButtonClick
                    },
                    'serviceview > grid button[text="Suche"]' : {
                        click  : this.displaySearchWindow
                    },
                    'print-all-button' : {
                        click  : this.onPrintAllButtonClick
                    },
                    'expandedservices' : {
                        beforeshow : this.onShowAllServices
                    },
                    'serviceview > grid button[iconCls="icon-map"]' : {
                        click : this.onClickOverviewButton
                    },
                    'adduserwindow > form button[text="Auftrag per Mail senden"]' : {
                        click : this.onSendAddUserTaskAsMail
                    },
                    'adduserwindow > form textfield' : { 
                        specialkey  : this.onSpecialKey
                    },
                    'adduserwindow' : { 
                        beforeshow : this.onAddUserWindowBeforeShow,
                        show       : this.onAddUserWindowShow
                    },
                    'deluserwindow' : { 
                        afterrender : this.onAfterDelUserWindowRender
                    },
                    'deluserwindow > form button[text="Auftrag per Mail senden"]' : {
                        click : this.onSendDelUserTaskAsMail
                    },
                    'addtorulewindow' : { 
                        show : this.onAddToRuleWindowShow
                    },
                    'addtorulewindow > form textfield' : { 
                        specialkey  : this.onSpecialKey
                    },
                    'addtorulewindow > form button[text="Auftrag per Mail senden"]' : {
                        click : this.onSendAddToRuleTaskAsMail
                    },
                    'delfromrulewindow > form button[text="Auftrag per Mail senden"]' : {
                        click : this.onSendDelFromRuleTaskAsMail
                    },
                    'searchwindow > panel button[toggleGroup="navGrp"]': {
                        click  : this.onNavButtonClick
                    },
                    'searchwindow > form button[text="Suche starten"]' : {
                        click  : this.onStartSearchButtonClick
                    },
                    'searchwindow > form > tabpanel fieldset > textfield' : { 
                        specialkey  : this.onSearchWindowSpecialKey
                    },
                    'searchwindow > form > tabpanel' : { 
                        tabchange  : this.onSearchWindowTabchange
                    },
                    'serviceview cardprintactive button[toggleGroup=polDVGrp]' : {
                        click  : this.onServiceDetailsButtonClick
                    }                    
                }
            );
        },

        onLaunch : function () {

            var store = this.getServiceStore();
            store.on( 'load',
                      function () {
                          var count = store.getCount();
                          var grid = this.getServicesGrid();
                          var sv = this.getServiceView();
                          var cardpanel = sv.down('cardprintactive');
                          var add_button = cardpanel.query('button[iconCls=icon-add]')[0];
                          var del_button = cardpanel.query('button[iconCls=icon-delete]')[0];
                          if ( count === 0 ) {
                              this.clearDetails();
                              add_button.disable();
                              del_button.disable();
                          }
                          else {
                              this.getServicesGrid().select0();
                              add_button.enable();
                              del_button.enable();
                          }
                          // Display nr of services in header.
                          grid.getView().getHeaderCt().getHeaderAtIndex(0).setText(
                              'Dienstname (Anzahl: ' + count + ')' );
                      },
                      this
                    );

            var userstore = this.getUsersStore();
            userstore.on( 'load',
                      function ( ustore ) {
                          // Always select first user object.
                          this.getServiceUsersView().select0();
                      },
                      this
                    );

            var rulesstore = this.getRulesStore();
            rulesstore.on( 'load',
                          function ( rstore ) {
                              
                              // Only show buttons to change rule if user is admin
                              // and not watcher for current owner. And
                              // only show buttons for own services.
                              var grid = this.getRulesGrid();
                              var relation = this.getCurrentRelation();
                              var ac = grid.down('actioncolumn');
                              if ( relation === 'owner' && appstate.isAdmin() ) {
                                  ac.show();
                              }
                              else {
                                  ac.hide();
                              }
                          },
                           this
                        );
            
            appstate.addListener(
                'changed', 
                function () {
                    if ( appstate.getInitPhase() ) { return; }
                    appstate.setAdmin( false );
                    this.onBeforeActivate();
                },
                this
            );
        },
        
        onBeforeActivate : function () {
            this.loadServiceStoreWithParams();
        },

        onAddUserClick : function () {
            add_user_window = Ext.create('PolicyWeb.view.window.AddUser');
            add_user_window.show();
        },

        onDeleteUserClick : function () {
            del_user_window = Ext.create('PolicyWeb.view.window.DeleteUser');
            del_user_window.show();
        },

        onDeleteObjectFromRule : function (view, rowIndex, colIndex, item, e,
                                      record, row, action) {
            
            var label2field = {
                'Quelle'    : 'src',
                'Ziel'      : 'dst',
                'Protokoll' : 'prt'
            };
            var rules_grid = this.getRulesGrid();
            var rules_store = rules_grid.getStore();
            var rec = rules_store.getAt(rowIndex);
            del_from_rule_window = Ext.create('PolicyWeb.view.window.DeleteFromRule');
            var controller = PolicyWeb.getApplication().getController('Service');

            del_from_rule_window.on(
                'beforeshow',
                function () {
                    controller.disableUserRadios( del_from_rule_window, rec );
                            var service = controller.getSelectedServiceName();
                    var fieldset = del_from_rule_window.down( 'fieldset' );
                    var title = "Objekt aus Regel Nr." + (rowIndex+1) +
                                       " des Dienstes \"" + service + "\" entfernen";
                    fieldset.setTitle( Ext.String.ellipsis( title, 70 ) );
                    var combo = del_from_rule_window.down( 'combo' );
                    var radio = del_from_rule_window.down( 'radio[boxLabel="Protokoll"]' );
                    var radiogroup = del_from_rule_window.down( 'radiogroup' );
                    radiogroup.on(
                        'change',
                        function () {
                            var selected = radio.getGroupValue();
                            var field = label2field[selected];
                            var re = /\s*<br>\s*/;
                            var raw_data = rec.get( field ).split(re);
                            var to_array_of_hashes = function(item) {
                                return {
                                    item : item
                                };
                            };
                            var combo_store = Ext.create(
                                'Ext.data.Store',
                                {
                                    model    : 'PolicyWeb.model.Item',
                                    data     : raw_data.map( to_array_of_hashes ),
                                    autoLoad : true
                                }
                            );
                            combo.bindStore( combo_store );
                            var records = combo_store.getRange(0,0);
                            if ( records.length > 0 ) {
                                combo.setValue( records[0].get('item'));
                            }
                            else {
                                combo.setValue('');
                            }
                        }
                    );
                    radio.setValue( true );
                }
            );
            del_from_rule_window.show();
        },

        onAddObjectToRule : function (view, rowIndex, colIndex, item, e,
                                      record, row, action) {
            add_to_rule_window = Ext.create('PolicyWeb.view.window.AddToRule');
            var grid = add_to_rule_window.down('servicerules');
            var store = grid.getStore();
            store.on(
                'load',
                function () {
                    if ( rowIndex > 0 ) {
                        var count = store.getTotalCount();
                        store.removeAt( 0, rowIndex );
                        store.removeAt( 1, count - rowIndex );
                    }
                    var rec = store.getAt(0);
                    var controller = PolicyWeb.getApplication().getController('Service');
                    controller.disableUserRadios( add_to_rule_window, rec );
                }
            );
            store.load(
                {
                    params : {
                        service : this.getSelectedServiceName()
                    }
                }
            );
            add_to_rule_window.show();
            grid.down('actioncolumn').hide();
        },

        disableUserRadios : function ( window, rec ) {
            var field2label = {
                'src'   : 'Quelle',
                'dst'   : 'Ziel'
            };
            var radio;
            if ( rec.raw.has_user ) {
                var what = rec.raw.has_user === 'both' ?
                    [ 'src', 'dst' ]  :  [ rec.raw.has_user ];
                for ( var i=0; i<what.length; i++) {
                    var selector = 'radio[boxLabel="' + field2label[what[i]] + '"]';
                    radio = window.down( selector );
                    radio.disable();
                }
            }
        },

        onPrintRules : function () {
            // This overrides the standard printview mechanism, so
            // that we can add the service name to the grid of rules
            // to be printed.
            var service_name = this.getSelectedServiceName();
            if ( service_name ) {
                var rules_grid = this.getRulesGrid();
                Ext.ux.grid.Printer.mainTitle = 'Dienst: ' + service_name;
                Ext.ux.grid.Printer.print( rules_grid );
                Ext.ux.grid.Printer.mainTitle = '';
            }
        },

        loadServiceStoreWithParams : function () {
            // Take search and other params into account when
            // loading service-store.
            var store         = this.getServiceStore();
            var relation      = this.getCurrentRelation();
            var extra_params  = store.getProxy().extraParams;
            var cb_params     = this.getCheckboxParams();
            var search_params = this.getSearchParams();
            var params        = Ext.merge( cb_params, extra_params );
            params            = Ext.merge( params, search_params );
            params.relation   = relation;
            store.load( { params : params } );
        },
        
        onServiceSelected : function( rowmodel, service, index, eOpts ) {
            // Load details, rules and emails of owners
            // for selected service.
            if (! service) {
                this.clearDetails();
                return;
            }

            this.getController('Main').closeOpenWindows();

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
            var rules_store = this.getRulesStore();
            rules_store.getProxy().extraParams.service = name;
            var params = this.getCheckboxParams();
            var relation = this.getCurrentRelation();
            // The buttons "Eigene", "Genutzte" and "Nutzbare"
            // have a relation attribute. The only one without this
            // attribute is the search button and relation will
            // be undefined, so we merge in the search parameters.
            if ( typeof relation === 'undefined' && params.filter_rules === 1 ) {
                params = Ext.merge(
                    params,
                    this.getSearchParams()
                );
            }
            rules_store.load( { params : params } );

            // Load users.
            var user_store = this.getUsersStore();
            user_store.getProxy().extraParams.service = name;
            user_store.load( { params : params } );
        },
        
        onTriggerClick : function() {
            var owner_field = this.getOwnerField();
            var owner_text  = this.getOwnerTextfield();
            var formpanel   = this.getServiceDetailsForm();
            var form   = formpanel.getForm();
            var record = form.getRecord();
            if ( record ) {
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
            }
        },

        clearDetails : function() {
            var formpanel = this.getServiceDetailsForm();
            var form      = formpanel.getForm();
            var trigger   = this.getOwnerTrigger();
            form.reset( true );
            trigger.hide();
            trigger.ownerCt.doLayout();
            this.getRulesStore().removeAll();
            this.getUsersStore().removeAll();
            this.getOwnerEmails().clear();
            this.getUserDetailEmails().clear();
        },

        onPrintAllButtonClick : function( button, event, eOpts ) {
            if ( !Ext.isObject(print_window) ) {
                print_window = Ext.create(
                    'PolicyWeb.view.window.ExpandedServices'
                );
            }
            print_window.show();
        },
        
        getSearchParams : function() {
            var search_params = {};
            var form;
            if ( Ext.isObject(search_window) ) {
                form = this.getSearchFormPanel().getForm();
                if ( form.isValid() ) {
                    search_params = form.getValues();
                    return this.removeNonActiveParams( search_params );
                }
            }
            return {};
        },

        onClickOverviewButton : function( button ) {
            this.getOverviewData( button, 'graph' );
        },

        getOverviewData : function( button, display_as ) {

            if ( Ext.isObject( graph_window ) ) {
                graph_window.close();
            }

            graph_window = Ext.create(
                'Ext.window.Window',
                {
                    title  : 'Überblick über Verbindungen',
                    id     : 'graph',
                    height : 410,
                    width  : 910,
                    items  : [ { xtype : 'owncurrentresources' } ]
                }
            );

            var res_panel = graph_window.down('owncurrentresources');
            var store = res_panel.getStore();
            var sc = PolicyWeb.getApplication().getController('Service');
            var params = sc.getServiceStore().getProxy().extraParams;
            params.relation = sc.getCurrentRelation();
            params.display_as = display_as;
            params = Ext.merge(
                params,
                sc.getSearchParams()
            );

            // FOO
            graph_window.on(
                'beforeshow',
                function () {
                    store.on( 'load',
                              function () {
                                  //console.dir( store.getRange() );
                              }
                            );
                    
                    store.load( { params : params } );
                }
            );            

            graph_window.show();

/*
            var data = Ext.encode(
                {
                    data : store.getRange()
                }
            );

            Ext.Ajax.request(
                {
                    url      : 'backend/get_connection_overview',
                    method   : 'POST',
                    jsonData : data,
                    params   : params,
                    success  : function ( response ) {
                        var controller = PolicyWeb.getApplication().getController('Service');
                        var response_data = Ext.decode(response.responseText);
                        if ( display_as === 'list' ) {
                            controller.displayOverviewList(response_data);
                        }
                        else {
                            controller.displayOverviewGraph(response_data);
                        }
                    },
                    failure  : function ( response ) {
                        console.log('server-side failure with status code '
                                    + response.status);
                    }
                }
            );
*/
        },

        drawGraph : function ( dataset ) {
            
            if ( Ext.isObject( graph_window ) ) {
                graph_window.close();
            }

            graph_window = Ext.create(
                'Ext.window.Window',
                {
                    title  : 'Überblick über Verbindungen',
                    id     : 'graph',
                    height : 410,
                    width  : 910
                }
            );

            // FOO
            graph_window.on(
                'show',
                function () {

                    // create a network
                    var container = document.getElementById('graph-innerCt');
                    var data = {
                        nodes: dataset.data.nodes,
                        edges: dataset.data.edges
                    };
                    var options = {};
                    network_graph = new vis.Network(container, data, options);
                    
                }
            );


            graph_window.show();

        },

        displayOverviewGraph : function ( data ) {
            try {
                if ( Ext.isObject( vis ) ) {
                    this.drawGraph( data );
                }
            } catch (err) {
                //console.log( "Caught ERROR: " + err );
                Ext.Loader.loadScript(
                    {
                        url    : "resources/vis.min.js",
                        onLoad : function () {
                            PolicyWeb.getApplication().getController('Service').drawGraph(data);
                        },
                        onError : function () {
                            alert("Unable to load external graphical library 'vis.min.js'!");
                        }
                    }
                );
            }
        },

        displayOverviewList : function ( data ) {
            var grid;
            if ( Ext.isObject( overview_window ) ) {
                overview_window.close();
            }
            grid = Ext.create(
                'PolicyWeb.view.panel.grid.ConnectionOverview'
            );
            overview_window = Ext.create(
                'Ext.window.Window',
                {
                    title  : 'Überblick über Verbindungen',
                    height : 400,
                    width  : 600,
                    layout : 'fit',
                    items  : [ grid ]
                }
            );
            console.dir( data );
            overview_window.on(
                'show',
                function () {
                    var store, rec;
                    store = grid.getStore();
                    store.loadRawData( data.records );
                }
            );
            overview_window.show();
        },

        onShowAllServices : function( win ) {
            var srv_store     = this.getServiceStore();
            var grid          = win.down( 'grid' );
            var extra_params  = srv_store.getProxy().extraParams;
            var cb_params     = this.getCheckboxParams();
            var params        = Ext.merge( cb_params, extra_params );
            params.relation   = this.getCurrentRelation();
            params = Ext.merge(
                params,
                this.getSearchParams()
            );
            grid.getStore().load( { params : params } );
        },

        getCurrentRelation : function() {
            var b = this.getCurrentlyPressedServiceButton();
            return b.relation;
        },

        getCurrentlyPressedServiceButton : function() {
            var sg = this.getServicesGrid();
            var tb = sg.getDockedItems('toolbar[dock="top"]');
            var b  = tb[0].query( 'button[pressed=true]' );
            return b[0];
        },

        onButtonClick : function( button, event, eOpts ) {
            var relation = button.relation;
            var store    = this.getServiceStore();
            var proxy    = store.getProxy();
            var sb       = this.getSearchServiceButton();
            sb.toggle( false );
            
            // Enable checkboxes for user expansion and toggling
            // of ip and names of objects.
            this.enableAndDisableCheckboxes(
                {
                    'expand_users'     : 1,
                    'display_property' : 1
                },
                {
                    'filter_rules' : 1
                }
            );

            // Don't reload store if button clicked on is the one
            // that was already selected.
            if ( !button.pressed && relation &&
                 relation === proxy.extraParams.relation ) {
                     button.toggle( true );
                     return;
            }

            // Pressing "Eigene/Genutzte Dienste" should clear
            // search form. Otherwise when changing owner, a search
            // with leftover params will be performed, although
            // own or used services should be displayed.
            if ( Ext.isObject( search_window ) ) {
                this.getSearchFormPanel().getForm().reset();
            }
            
            proxy.extraParams.relation = relation;
            store.load();
        },

        onNavButtonClick : function( button, event, eOpts ) {
            var card  = this.getSearchCardPanel();
            var index = button.ownerCt.items.indexOf(button);
            card.layout.setActiveItem( index );
        },

        removeNonActiveParams : function( params ) {
            /*
             * Remove textfield params of non-active tabpanel
             * from search parameters.
             */
            var tab_panel  = this.getSearchTabPanel();
            var active_tab = tab_panel.getActiveTab();
            var index = tab_panel.items.indexOf( active_tab );
            if ( index === 0 ) {
                params.search_string = '';
            }
            else {
                params.search_ip1    = '';
                params.search_ip2    = '';
                params.search_proto  = '';
            }
            return params;
        },

        onStartSearchButtonClick : function( button, event, eOpts ) {
            var form = this.getSearchFormPanel().getForm();
            var sb = this.getSearchServiceButton();
            this.enableCheckboxes( {'filter_rules' : 1} );
            if ( form.isValid() ) {
                button.search_params = form.getValues();
                var store      = this.getServiceStore();
                var relation   = button.relation;
                var keep_front = false;
                var params     = this.removeNonActiveParams(
                    button.search_params);
            
                if ( params ) {
                    keep_front = params.keep_front;
                }
                if ( search_window && !keep_front ) {
                    search_window.hide();
                }

                // Highlight "Suche"-button
                var b = this.getCurrentlyPressedServiceButton();
                b.toggle(false);
                sb.toggle(true);

                params.relation = '';
                store.on(
                    'load',
                    function ( mystore, records ) {
                        if ( records.length === 0 ) {
                            var m = 'Ihre Suche ergab keine Treffer!';
                            Ext.MessageBox.alert( 'Keine Treffer für Ihre Suche!', m );
                        }
                    },
                    this,  // scope (defaults to the object which fired the event)
                    { single : true }   // deactivate after being run once 
                );
                store.load(
                    {
                        params   : params
                    }
                );
            } else {
                var m = 'Bitte Eingaben in rot markierten ' +
                    'Feldern korrigieren.';
                Ext.MessageBox.alert( 'Fehlerhafte Eingabe!', m );
            }
        },
        
        onSendAddUserTaskAsMail : function() {
            var store   = this.getStore('SendNewUserTaskMail');
            var service = this.getSelectedServiceName();
            var panel   = this.getAddUserFormPanel();
            var form    = panel.getForm();
            if ( form.isValid() ) {
                // FOO
                // get business unit from combo box
                var bu_combo = panel.down('combo');
                var business_unit = bu_combo.getRawValue() || 'Unbekannt';
                var tfs = panel.query('textfield');
                var user_object_ip   = tfs[0].getValue();
                var user_object_name = tfs[2].getValue();
                var params = {
                    service          : service,
                    user_object_name : user_object_name,
                    user_object_ip   : user_object_ip,
                    business_unit    : business_unit
                };

                // Further evaluate form data. Check for valid IP address.
                var array = user_object_ip.split('/');
                var ip = array[0];
                var mask = array[1];
                var rex = /\./;
                var valid_mask = true;
                var valid_ip = isIPv4Address( ip );
                var num_mask;
                var num_ip = ip2numeric( ip );
                var msg;
                var res_ip;
                if ( valid_ip ) {
                    if ( mask ) {
                        if ( !rex.test( mask ) ) {
                            if ( mask < 1 || mask > 32 ) {
                                valid_mask = false;
                                msg = "CIDR Maske \"" + mask +
                                    "\" außerhalb des gültigen Bereichs: 0 <= Maske <= 32!";
                            }
                            else {
                                // Valid CIDR mask, now check if it fits IP.
                                mask = cidr2mask( mask );
                                num_mask = ip2numeric( mask );
                                res_ip = num_ip & num_mask;
                                if ( res_ip !== num_ip ) {
                                    valid_mask = false;
                                    msg = "IP passt nicht zur Maske! Falls Maske richtig " +
                                        "sollte die IP lauten: " + numeric2ip( res_ip );
                                }
                            }
                        }
                        else {
                            if ( isIPv4Address( mask ) ) {
                                // mask is in dot notation
                                num_mask = ip2numeric( mask );
                                res_ip = num_ip & num_mask;
                                if ( res_ip !== num_ip) {
                                    valid_mask = false;
                                    msg = "IP passt nicht zur Maske! Falls Maske richtig " +
                                        "sollte die IP lauten: " + numeric2ip( res_ip );
                                }
                            }
                            else {
                                valid_mask = false;
                                msg = "Ungültige Maske: " + mask;
                            }
                        }
                    }
                }
                else {
                    msg = "Bei \"" + ip + "\" handelt es sich nicht um eine gültige IP-Adresse!";
                }

                if ( valid_ip && valid_mask ) {
                    store.load( { params : params  } );
                    add_user_window.close();
                }
                else {
                    Ext.MessageBox.alert( 'Netzmaske passt nicht zu IP', msg );
                }
            }
        },

        onSendDelUserTaskAsMail : function() {
            var store   = this.getStore('SendDeleteUserTaskMail');
            var service = this.getSelectedServiceName();
            var panel   = this.getDelUserFormPanel();
            var form    = panel.getForm();
            if ( form.isValid() ) {
                var combos = panel.query('combo');
                var value  = combos[0].getValue();
                var array  = value.split("\t");
                var user_object_ip   = array[0];
                var user_object_name = array[1];
                var params = {
                    service          : service,
                    user_object_name : user_object_name,
                    user_object_ip   : user_object_ip
                };
                store.load( { params : params  } );
                del_user_window.close();
            }
        },

        onSendAddToRuleTaskAsMail : function() {
            var panel = this.getAddToRuleFormPanel();
            var form  = panel.getForm();
            var store, record, data;
            if ( form.isValid() ) {
                store = panel.down('grid').getStore();
                record = store.getAt(0);
                data = Ext.encode(
                    {
                        action : record.get('action'),
                        src    : record.get('src'),
                        dst    : record.get('dst'),
                        prt    : record.get('prt')
                    }
                );

                var new_object = panel.query('textfield')[0].getValue();

                Ext.Ajax.request(
                    {
                        url      : 'backend/send_add_to_rule_task_mail',
                        method   : 'POST',
                        jsonData : data,
                        params   : {
                            service      : this.getSelectedServiceName(),
                            history      : appstate.getHistory(),
                            active_owner : appstate.getOwner(),
                            what         : panel.down('radio').getGroupValue(),
                            object       : new_object
                        },
                        success : function ( response ) {
                            add_to_rule_window.close();
                        },
                        failure : function ( response ) {
                        }
                    }
                );
            } 
        },

        onSendDelFromRuleTaskAsMail : function() {
            var panel = this.getDelFromRuleFormPanel();
            var form  = panel.getForm();
            var fieldset = panel.down( 'fieldset' );
            var title = fieldset.title;
            var re = /Objekt aus Regel Nr\.(\d+)/;
            var index = title.match(re)[1];
            if ( index === undefined ) {
                alert('Unable to determine index of rule');
            }
            if ( form.isValid() ) {
                var delete_from = panel.down('radio').getGroupValue();
                var combo = panel.down('combo');
                if ( combo.getStore().data.length > 1 ) {
                    var record = this.getRulesStore().getAt(index-1);
                    var selected = combo.getValue();
                    var data = Ext.encode(
                        {
                            action : record.get('action'),
                            src    : record.get('src'),
                            dst    : record.get('dst'),
                            prt    : record.get('prt')
                        }
                    );
                    Ext.Ajax.request(
                        {
                            url      : 'backend/send_del_from_rule_task_mail',
                            method   : 'POST',
                            jsonData : data,
                            params   : {
                                service      : this.getSelectedServiceName(),
                                history      : appstate.getHistory(),
                                active_owner : appstate.getOwner(),
                                object       : selected,
                                what         : delete_from
                            },
                            success : function ( response ) {
                                del_from_rule_window.close();
                            },
                            failure : function ( response ) {
                            }
                        }
                    );
                }
                else {
                    Ext.Msg.show(
                        {
                            title     : 'Auftrag ungültig',
                            msg       : '"' + delete_from + '" hat nur ein Element, welches folglich nicht gelöscht werden kann!',
                            buttons   : Ext.Msg.OK,
                            icon      : Ext.Msg.ERROR
                        }
                    );
                }
            }
        },

        onAfterDelUserWindowRender : function( window ) {
            var service = this.getSelectedServiceName();
            var params = {
                service : service
            };
            var combo = window.down('combo');
            var store = combo.getStore();
            store.on(
                'beforeload',
                function(store, operation, eOpts) {
                    operation.params = params;
                }
            );
        },

        onServiceDetailsButtonClick : function( button, event, eOpts ) {
            // We have two buttons: "Details zum Dienst"
            // and "Benutzer (User) des Dienstes".
            // index: 0 = service details
            //        1 = vertical separator
            //        2 = service User
            var card  = this.getDetailsAndUserView();
            var index = button.ownerCt.items.indexOf(button);
            var active_idx = card.items.indexOf( card.layout.activeItem );

            // Only enable filter checkbox if we are in search mode
            // (relation is undefined).
            var filter = this.getCurrentRelation() === undefined ? 1 : 0;

            if ( index === 2 ) {
                // This is necessary because the vertical separator
                // between the two buttons has an index, too.
                index = index - 1;
                this.enableAndDisableCheckboxes(
                    {
                        'filter_rules'     : filter
                    },
                    {
                        'expand_users'     : 1,
                        'display_property' : 1
                    }
                );
            }
            else {
                this.enableCheckboxes(
                    {
                        'expand_users'     : 1,
                        'display_property' : 1,
                        'filter_rules'     : filter
                    }
                );
            }
            if ( index === active_idx ) {
                button.toggle();
                return;
            }
            card.layout.setActiveItem( index );
        },

        enableAndDisableCheckboxes : function( to_enable, to_disable ) {
            var card  = this.getDetailsAndUserView();
            var active_idx = card.items.indexOf( card.layout.activeItem );
            if ( active_idx > 0 ) {
                this.disableAllCheckboxes();
            }
            else {
                if ( typeof to_enable !== 'undefined' ) {
                    this.enableCheckboxes(  to_enable  );
                }
                if ( typeof to_disable !== 'undefined' ) {
                    this.disableCheckboxes( to_disable );
                }
            }
        },

        enableCheckboxes : function(cb_hash) {
            var view       = this.getServiceView();
            var checkboxes = view.query('checkbox');
            Ext.each(
                checkboxes, 
                function(cb) {
                    if ( cb_hash[cb.name] === 1 ) {
                        cb.enable();
                    }
                }
            );
        },

        disableCheckboxes : function(cb_hash) {
            var view       = this.getServiceView();
            var checkboxes = view.query('checkbox');
            Ext.each(
                checkboxes, 
                function(cb) {
                    if ( cb_hash[cb.name] === 1 ) {
                        cb.disable();
                    }
                }
            );
        },

        disableAllCheckboxes : function() {
            this.disableCheckboxes(
                {
                    'filter_rules'     : 1,
                    'expand_users'     : 1,
                    'display_property' : 1
                }
            );
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

        onSearchWindowSpecialKey : function( field, e ) {
            // Handle ENTER key press in search textfield.
            if ( e.getKey() == e.ENTER ) {
                var sb = this.getStartSearchButton();
                sb.fireEvent( 'click', sb );
            }
        },
        
        onSpecialKey : function( field, e ) {
            // Handle ENTER key press in search textfield.
            var form_panel = field.up( 'form' );
            var button = form_panel.down( 'button' );
            if ( e.getKey() == e.ENTER ) {
                button.fireEvent( 'click', button );
            }
        },
        
        onAddUserWindowBeforeShow : function( au_window ) {
            var service = this.getSelectedServiceName();
            au_window.setTitle('Benutzer("User") hinzufügen für "' + service + '"');
        },

        onAddUserWindowShow : function( au_window ) {
            var tf = au_window.query( 'textfield:first' );
            tf[0].focus( true, 20 );
        },

        onAddToRuleWindowShow : function( a2r_window ) {
            var tf = a2r_window.query( 'textfield:first' );
            tf[0].focus( true, 20 );
        },

        onSearchWindowTabchange : function( tab_panel, new_card, old_card ) {
            var tf = new_card.query( 'textfield:first' );
            tf[0].focus( true, 20 );
        },

        getCheckboxParams : function( checkbox, newVal ) {
            var params     = {};
            var view       = this.getServiceView();
            var checkboxes = view.query('checkbox');

            Ext.each(
                checkboxes, 
                function(cb) {
                    var name = cb.getName();
                    var value;
                    if ( !checkbox ) {
                        value = cb.getValue();
                    }
                    else {
                        if ( name === checkbox.getName() ) {
                            value = newVal;
                        }
                        else {
                            value = cb.getValue();
                        }
                    }
                    params[name] = cb_params_key2val[name][value];
                }
            );
            return params;
        },

        onCheckboxChange : function( checkbox, newVal, oldVal, eOpts ) {
            var params;
            var srv_store = this.getServiceStore();
            if ( srv_store.getTotalCount() > 0 ) {
                params = this.getCheckboxParams( checkbox, newVal );
                if ( typeof relation === 'undefined' && params.filter_rules === 1 ) {
                    params = Ext.merge(
                        params,
                        this.getSearchParams()
                    );
                }
                var rules = this.getRulesStore();
                rules.load( { params : params } );
                var users = this.getUsersStore();
                users.load( { params : params } );
            }
            if ( Ext.isObject( print_window ) ) {
                this.onShowAllServices( print_window );
            }
        },
        
        displaySearchWindow : function() {
            if ( !search_window ) {
                search_window = Ext.create(
                    'PolicyWeb.view.window.Search'
                );
                search_window.on( 'show', function () {
                                      search_window.center();
                                      var t = search_window.query(
                                          'form > tabpanel fieldset > textfield'
                                      );
                                      t[0].focus( true, 20 );
                                  }
                                );
            }
            search_window.show();
        },

        //
        // Helper functions for convenience and code reuse.
        //
        getSelectedService : function () {
            var service;
            var service_grid = this.getServicesGrid();
            var sel_model = service_grid.getSelectionModel();
            var selected  = sel_model.getSelection();
            if ( selected ) {
                service = selected[0];
            }
            return service;
        },

        getSelectedServiceData : function () {
            var data;
            var service = this.getSelectedService();
            if ( service ) {
                data = service.data;
            }
            return data || undefined;
        },        

        getSelectedServiceName : function () {
            var service_name;
            var data = this.getSelectedServiceData();
            if ( data ) {
                service_name = data.name;
            }
            return service_name || undefined;
        }
    }
);
