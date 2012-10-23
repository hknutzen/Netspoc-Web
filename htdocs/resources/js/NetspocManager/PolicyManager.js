
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.PolicyManager
 * @extends Ext.Panel
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype policymanager
 **/

var search_window;
var print_window;

NetspocManager.PolicyManager = Ext.extend(
    Ext.Container,
    {
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildPolicyListPanel(),
                this.buildPolicyDetailsView()
            ];
            
            NetspocManager.PolicyManager.superclass.initComponent.call(this);
            var plv = Ext.getCmp('policyListId');
            var store = plv.getStore();
            store.setBaseParam('relation', 'user');
        },
        
        buildPolicyListPanel : function() {
            return {
                xtype      : 'simplelist',
                proxyurl   : 'service_list',
                autoSelect : true,
		doReload   : true,
		sortInfo   : { field: 'name', direction: "ASC" },
                fieldsInfo : [
		    { name     : 'name', 
		      header   : 'Dienstname',
                      sortType : 'asUCString' 
                    },
		    { name : 'desc',  mapping : 'description' },
		    { name : 'owner' }
		],
                id        : 'policyListId',
                flex      : 1,
                border    : false,
                listeners : {
                    scope : this,
                    selectionchange : this.onPolicySelected
                },
                tbar      : [
                    {
                        text         : 'Eigene',
                        toggleGroup  : 'polNavBtnGrp',
                        enableToggle : true,
                        relation     : 'owner',
                        scope        : this,
                        handler      : this.onButtonClick
                    },
                    {
                        text         : 'Genutzte',
                        toggleGroup  : 'polNavBtnGrp',
                        pressed      : true,
                        enableToggle : true,
                        relation     : 'user',
                        scope        : this,
                        handler      : this.onButtonClick
                    },
                    {
                        text         : 'Nutzbare',
                        toggleGroup  : 'polNavBtnGrp',
                        enableToggle : true,
                        relation     : 'visible',
                        scope        : this,
                        handler      : this.onButtonClick
                    },
                    {
                        text         : 'Alle',
                        toggleGroup  : 'polNavBtnGrp',
                        enableToggle : true,
                        relation     : undefined,
                        storeParams  : {},
                        scope        : this,
                        handler      : this.onButtonClick
                    },
                    {
                        text         : 'Suche',
                        toggleGroup  : 'polNavBtnGrp',
                        enableToggle : true,
                        allowDepress : false,
                        scope        : this,
                        handler      : this.displaySearchWindow
                    },
                    '->',
                    {
                        iconCls : 'icon-eye',
                        tooltip : 'Weitere (druckbare) Ansichten öffnen',
                        scope   : this,
                        handler : this.displayPrintWindow
                    }
                ]
            };

        },
        
        onButtonClick :  function(button, event) {
            var plv        = Ext.getCmp('policyListId');
            var store      = plv.getStore();
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
                // Find services-and-rules-window and close it.
                var wnd = Ext.WindowMgr.get( 'srvRulesWndId' );
                if ( wnd ) {
                    wnd.close();
                }
            }
            if ( ! relation || relation === store.baseParams.relation) {
                return;
            }
            store.setBaseParam('relation', relation);
            store.load();
            this.clearDetails();
        },

        displaySearchWindow :  function( button, event ) {
            if ( search_window ) {
                search_window.show();
            }
            else {
                search_window = new NetspocWeb.window.SearchFormWindow();
                search_window.show();
            }
        },

        displayPrintWindow :  function( button, event ) {
            // Find services-and-rules-window and close it.
            var wnd = Ext.WindowMgr.get( 'srvRulesWndId' );
            if ( wnd ) {
                wnd.close();
            }
            if ( Ext.isObject( print_window ) ) {
                print_window.show();
            }
            else {
                print_window = new NetspocWeb.window.PrintWindow();
                print_window.show();
            }
        },

        printDetails : function() {
            
            var fp    = this.findByType( 'form' )[0];
            var name  = fp.find( 'name', 'name'  )[0];
            var desc  = fp.find( 'name', 'desc'  )[0];
            var owner = fp.find( 'name', 'owner' )[0];

            // Load rules.
            var store = Ext.StoreMgr.get('dvRulesStoreId');

            var grid = Ext.getCmp("grdRulesId");
                
            var details = Ext.ux.Printer.print2html( grid );
            var win = window.open( '', 'dienste_details_drucken' );
            win.document.write( details );
        },
        
        buildPolicyDetailsView : function() {
            var detailsPanel = 
                {
                    layout     : 'border',
                    items      : [
                        this.buildPolicyDetailsDV(),
                        this.buildPolicyRulesDV(),
                        {
                            region      : 'south',
                            id          : 'PolicyEmails',
                            xtype       : 'emaillist',
                            title       : 'Verantwortliche',
                            collapsible : true,
                            split       : true,
                            height      : 68
                        }
                    ]
                };

            var userPanel = new Ext.Panel(
                {
                    layout : 'border',
                    items  : [
                        this.buildUserDetailsDV(),  // center region (default)
                        {
                            id          : 'UserEmails',
                            xtype       : 'emaillist',
                            title       : 'Verantwortliche',
                            region      : 'south',
                            collapsible : true,
                            split       : true,
                            height      : 68
                        }
                    ]
                }
            );
            
            return {
                xtype : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
                tbar : [
                    {
                        text          : 'Details zum Dienst',
                        toggleGroup   : 'polDVGrp',
                        enableToggle  : true,
                        pressed       : true,
                        scope         : this,
                        handler       : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 0 );
                        }
                    },
                    '-',
                    {
                        text         : 'Benutzer (User) des Dienstes',
                        toggleGroup  : 'polDVGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 1 );
                        }
                    },
                    '->',
                    {
                        xtype     : 'printbutton'
                    }
                ],
                items : [
                    detailsPanel,
                    userPanel
                ]
            };
        },

        buildPolicyRulesDV : function() {

            var bold_user = function ( node, what ) {
                if ( node.has_user === what || node.has_user === 'both' ) {
                    return '<span style="font-weight:bold;"> User </span>';
                }
                else {
                    return what === 'src' ?  node.src.join( '<br>' ) :
                        node.dst.join( '<br>' );
                };
            };

            var store = {
                xtype    : 'netspocstatestore',
                proxyurl : 'get_rules',
                storeId  : 'dvRulesStoreId',
                fields   : [
                    { name : 'has_user', mapping : 'hasuser'  },
                    { name : 'action',   mapping : 'action'  },
                    { name : 'src',      mapping : function( node ) {
                          return bold_user( node, 'src' );
                      }
                    },
                    { name : 'dst',      mapping : function( node ) {
                          return bold_user( node, 'dst' );
                      }
                    },
                    { name : 'srv',      mapping : function( node ) {
                          return node.srv.join( '<br>' );
                      }
                    }
                ]
            };
            
            var colModel = new Ext.grid.ColumnModel(
                {
                    columns    : [
                        {
                            header    : 'Aktion',
                            dataIndex : 'action',
                            width     : 50,
                            fixed     : true
                        },
                        {
                            header    : 'Quelle',
                            dataIndex : 'src'
                        },
                        {
                            header    : 'Ziel',
                            dataIndex : 'dst'
                        },
                        {
                            header    : 'Protokoll',
                            dataIndex : 'srv'
                        }
                    ],
                    defaults : {
                        menuDisabled : true
                    }
                }
            );

            var grid  = new Ext.grid.GridPanel(
                {
                    id         : 'grdRulesId',
                    border     : false,
                    store      : store,
                    cls        : 'grid-larger-font',
                    viewConfig : {
                        forceFit         : true,
                        selectedRowClass : 'x-grid3-row-over'
                    },
                    colModel   : colModel
                }
            );

            return new Ext.Panel(
                { layout    :'fit',
                  region    : 'center',
                  items     : [ grid ],
                  printView : function() { }
                }
            );
        },

        buildPolicyDetailsDV : function() {    
            var fp = new Ext.FormPanel(
                {
                    id          : 'policyDetailsId',
                    defaultType : 'textfield',
                    defaults    : { anchor : '100%' }, 
                    border      : false,
                    style       : { "margin-left": "3px" },
                    items       : [
                        { fieldLabel : 'Name',
                          name       : 'name',
                          anchor     : '100%',
                          readOnly   : true
                        },
                        { fieldLabel : 'Beschreibung',
                          name       : 'desc',
                          readOnly   : true
                        },
                        { xtype : 'hidden',
                          id    : 'hiddenOwner',
                          name  : 'owner'
                        },
                        { xtype          : 'trigger',
                          id             : 'trigger',
                          fieldLabel     : 'Verantwortung',
                          name           : 'owner1',
                          editable       : false,
                          onTriggerClick : this.bind(this.onTriggerClick)
                        }
                    ]
                }
            );
            return new Ext.Panel(
                { layout :'anchor',
                  region : 'north',
                  border : false,
                  items  : [ fp ],
                  printView : function() {
                      var pm = this.findParentByType( 'policymanager' );
                      pm.printDetails();
                  }
                }
            );
        },

        onPolicySelected : function() {
            var selectedPolicy = Ext.getCmp('policyListId').getSelected();
            if (! selectedPolicy) {
                this.clearDetails();
                return;
            }

            // Load details form with values from selected record.
            var form = Ext.getCmp("policyDetailsId").getForm();
            form.loadRecord(selectedPolicy);

            // Handle multiple owners.
            var array = selectedPolicy.get( 'owner' );
            var trigger = Ext.getCmp("trigger");
            if (array.length == 1) {
                // Hide trigger button if only one owner available.
                trigger.setHideTrigger(true);
                trigger.el.dom.style.backgroundColor = "#FFFFFF";
            }
            else {
                // Multiple owners available.
                trigger.setHideTrigger(false);
                // Give a visual hint in case of multiple owners.
                // This paints a coloured line below the text.
                trigger.el.dom.style.backgroundColor = "#FFC0C0";
            }
            // Show emails for first owner.
            this.onTriggerClick();

            // Load rules.
            var name  = selectedPolicy.get( 'name' );
            var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
            dvRules.load({ params : { service : name } });
            
            // Load users.
            var ulv = this.findById('userListId');
            ulv.loadStoreByParams( { service : name } );
        },

        // Generate function which is called in current scope.
        bind : function (fn) {
            var self = this;
            return function() {
                return fn.call(self);
            }; 
        },

        onTriggerClick : function() {
            var hidden = Ext.getCmp("hiddenOwner");

            // Don't use getValue, but access .value direct.
            // Otherwise, array would become stringified.
            var array = hidden.value;
            var owner1 = array.shift();
            var name = owner1.name;
            var alias = owner1.alias || name;
            array.push(owner1);
            Ext.getCmp('trigger').setValue(alias);
            Ext.getCmp('PolicyEmails').show(name, alias);
        },

        clearDetails : function() {
            var form = this.findById('policyDetailsId').getForm();
            var trigger = Ext.getCmp("trigger");
            form.reset();
            trigger.el.dom.style.backgroundColor = "#FFFFFF";
            trigger.setHideTrigger(true);

            var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
            dvRules.removeAll();
            var stUserDetails = this.findById('userListId').getStore();
            stUserDetails.removeAll();
            Ext.getCmp('PolicyEmails').clear();
            Ext.getCmp('UserEmails').clear();
        },

        buildUserDetailsDV : function() {
            return {
                xtype      : 'simplelist',
                region     : 'center',
                proxyurl   : 'get_users',
                autoSelect : true,
                sortInfo   : { field: 'ip', direction: "ASC" },
		fieldsInfo : [
		    { name     : 'name'  , 
                      header   : 'Name'
                    },
		    { name     : 'ip',
		      header   : 'IP-Adressen',
		      width    : .25,
		      sortType : function ( value ) {
			  var m1 = /-/;
			  var m2 = /\//;
			  if ( value.match(m1) ) {
			      var array = value.split('-');
			      return ip2numeric( array[0] );
			  }
			  else if ( value.match(m2) ) {
			      var array = value.split('/');
			      return ip2numeric( array[0] );
			  }
			  else {
			      return ip2numeric( value );
			  }
		      }
		    },
                    // Not shown, but needed to select the corresponding
                    // email addresses.
		    { name    : 'owner' },
                    { name    : 'owner_alias', 
		      header  : 'Verantwortungsbereich',
		      width   : .25,
                      mapping : function (node) { 
                          return node.owner_alias || node.owner;
                      }
                    }
                ],
                id        : 'userListId',
                listeners : {
                    scope : this,
                    selectionchange : this.onUserDetailsSelected
                }
            };
        },

        onUserDetailsSelected : function(dv, selections) {
            var node = selections[0];
            var record = node && dv.getRecord(node);
            var emailPanel = this.findById('UserEmails');
            if(record) {
                emailPanel.show(record.get('owner'),
                                record.get('owner_alias') );
            }
            else {
                emailPanel.clear();
            }
        }

    }
);

Ext.reg( 'policymanager', NetspocManager.PolicyManager );
