
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
	    var plv =  this.getComponent('policyListId');
	    plv.loadStoreByParams( { relation : 'user' } );
	},
	
	buildPolicyListPanel : function() {
            return {
		xtype    : 'policylist',
		proxyurl : 'service_list',
		itemId   : 'policyListId',
		flex     : 1,
		border   : false,
		listeners : {
                    scope : this,
                    selectionchange : this.onPolicySelected
		},
		tbar      :  [
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
			scope        : this,
			handler      : this.displaySearchWindow
                    },
		    '->',
		    {
			 xtype : 'printbutton'
		    }
		]
	    };

	},
	
	onButtonClick :  function(button, event) {
	    var sfw = Ext.getCmp( 'searchFormWindowId' );
	    if ( sfw ) {
		sfw.hide();
	    }
	    var plv = this.getComponent('policyListId');
	    var relation = button.relation;
	    var params   = button.search_params;
	    var url;

	    if ( relation ) {
		params = { relation : relation };
	    }
	    plv.loadStoreByParams(params);
	    this.clearDetails();
	},

	displaySearchWindow :  function(button, event) {
	    var checkbox_group1 = {
		xtype      : 'checkboxgroup',
		fieldLabel : 'Suche in Diensten',
		anchor     : '100%',
		columns    : 1,
		flex       : 1,
		defaults   : {
		    checked    : true
		},
		items      : [
		    {
			boxLabel   : 'Eigene',
			name       : 'search_own'
		    },
		    {
			boxLabel   : 'Genutzte',
			name       : 'search_used'
		    },
		    {
			boxLabel   : 'Sichtbare',
			name       : 'search_visible'
		    },
		    {
			boxLabel   : 'Alle',
			name       : 'search_all',
			//inputValue : 'search_all',
			handler    : function( cb, checked ) {
			    var cbg = cb.findParentByType( 'checkboxgroup' );
			    if ( checked === true ) {
				cbg.setValue( [ true, true, true ] );
			    }
			    else {
				cbg.setValue( [ false, false, false ] );
			    }
			}
		    }
		]
	    };
	    
	    var checkbox_group2 = {
		xtype      : 'checkboxgroup',
		fieldLabel : 'Suche in Regeln/User',
		anchor     : '100%',
		columns    : 1,
		flex       : 2,
		defaults   : {
		    checked    : true
		},
		items      : [
		    {
			boxLabel   : 'Regeln',
			name       : 'search_in_rules'
		    },
		    {
			boxLabel   : 'User',
			name       : 'search_in_user'
		    },
		    {
			boxLabel   : 'Regeln und User',
			name       : 'search_in_rules_and_user',
			handler    : function( cb, checked ) {
			    var cbg = cb.findParentByType( 'checkboxgroup' );
			    if ( checked === true ) {
				cbg.setValue( [ true, true ] );
			    }
			    else {
				cbg.setValue( [ false, false ] );
			    }
			}
		    }
		]
	    };
	    
	    var checkbox_container = {
		xtype  : 'container',
		layout : 'form',
		height : 120,
		layoutConfig : {
		    //labelAlign : 'top'
		},
		items : [
		    checkbox_group1,
		    checkbox_group2
		]
	    };
	    
	    var radio_group = {
		xtype      : 'radiogroup',
		anchor     : '100%',
		//fieldLabel : 'IP oder String',
		items      : [
		    {
			boxLabel   : 'Zeichenkette',
			name       : 'search_ip_or_string'
		    },
		    {
			boxLabel   : 'IP-Adresse',
			name       : 'search_ip_or_string'
		    }
		]
	    };
	    var searchtext = {
		xtype      : 'textfield',
		id         : 'search_string',
		width      : 300,
		emptyText  : 'Zeichenkette oder IP eingeben ... ',
		fieldLabel : 'Suchbegriff',
		allowBlank : false,
		minLength  : 2
	    };
	    
	    var myFormPanel = new Ext.form.FormPanel(
		{
		    id           : 'myFormPanel',
		    width        : 400,
		    height       : 250,
		    frame        : true,
		    bodyStyle    : 'padding: 6px',
		    labelWidth   : 70,
		    buttonAlign  : 'center',
		    layoutConfig : {
			align : 'stretch'
		    },
		    items        : [
			searchtext,
			{ height : 10 },
//			radio_group,
//			{ height : 10 },
			checkbox_container
		    ]
/*
		    keys    : [
			{
			    key: [
				Ext.EventObject.ENTER
			    ],
			    handler: function() {
				Ext.Msg.alert("Alert","Enter Key Event !");
			    }
			}
		    ],
*/
		}
	    );

	    var form = myFormPanel.getForm();
	    var search_button =
		myFormPanel.addButton( 'Suche starten', function( button, event )
				       {
					   if ( form.isValid() ) {
					       button.search_params = form.getValues();
					       var v   = Ext.getCmp( 'viewportId' );
					       var pm  = v.findByType("policymanager");
					       pm[0].onButtonClick( button );
					   } else {
					       var m = 'Bitte Eingaben korrigieren.';
					       Ext.MessageBox.alert( 'Fehlerhafte Eingabe!', m );
					   }
				       },
				       myFormPanel
				     );
	    
	    
	    var sfw = Ext.getCmp( 'searchFormWindowId' );
	    if ( sfw ) {
		sfw.show();
		return;
	    }
	    else {
		new Ext.Window(
 		    {
			id        : 'searchFormWindowId',
			title     : 'IP-Adresse oder Zeichenkette suchen',
 			width     : 450, 
 			height    : 350,
 			layout    : 'fit',
			resizable : false,
 			items     : [
			    myFormPanel
 			]
 		    }
 		).show();
	    }
	},

	printDetails : function() {
	    new Ext.Window(
 		{
 		    title     : 'Druckfunktion wird implementiert ...',
 		    width     : 500, 
 		    height    : 250,
 		    layout    : 'fit',
		    resizable : false,
 		    items     : [
 			{
 			    frame  : true,
 			    layout : {
 				type    : 'fit',
 				padding : '5',
 				align   : 'center'
 			    },
			    html : '<br><br><center> <h1> An einer Druckfunktion für Dienste-Details wird noch gearbeitet. </h1> <br><br> <h1> Wir bitten um etwas Geduld ... </h1> </center>'
 			}
 		    ]
 		}
 	    ).show();
	},
	
	buildPolicyDetailsView : function() {
	    var detailsPanel = 
		{
		    layout     : 'border',
		    autoScroll : true,
		    items      : [
			{
			    region : 'center',
			    layout : 'anchor',
			    items  : [
				this.buildPolicyDetailsDV(),
				this.buildPolicyRulesDV()
			    ],
			    printView : function() {
				var pm = this.findParentByType( 'policymanager' );
				pm.printDetails();
			    }
			},
			{
			    region      : 'south',
			    id          : 'PolicyEmails',
			    xtype       : 'emaillist',
			    proxyurl    : 'get_emails',
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
			    proxyurl    : 'get_emails',
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
		deferredRender : false,
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
	    var dvRulesTpl = new Ext.XTemplate(
		'<div class="rule-container">',  // div for one rule
		'<table>',

		'<tpl for=".">',   // rules-loop
		'<tr>',    // new row
		'<td class="action"> {action} </td> ',
		'<tpl if="has_user==src">',		    
		'<td class="user"> User  </td>',
		'<td class="dst" > {dst} </td>',
		'</tpl>',  // end tpl-if
		'<tpl if="has_user==dst">',		    
		'<td class="src" > {src} </td>',
		'<td class="user"> User  </td>',
		'</tpl>',  // end tpl-if
		'<td class="srv"> {srv}  </td>',
		'</tr>',    // end row
		'</tpl>',  // end rules-loop

		'</table>',
		'</div>'
	    );
    
	    var store = {
		xtype    : 'netspocstatestore',
		proxyurl : 'get_rules',
		storeId  : 'dvRulesStoreId',
		fields   : [
		    { name : 'has_user', mapping : 'hasuser' },
		    { name : 'action',   mapping : 'action'  },
		    { name : 'src',      mapping : function( node ) {
			  return node.src.join( '<br>' );
		      }
		    },
		    { name : 'dst',      mapping : function( node ) {
			  return node.dst.join( '<br>' );
		      }
		    },
		    { name : 'srv',      mapping : function( node ) {
			  return node.srv.join( '<br>' );
		      }
		    }
		]
	    };

	    return new Ext.DataView(
		{ tpl          : dvRulesTpl,
		  store        : store,
		  itemSelector : 'div.thumb-wrap' // OBLIGATORY when
		                                    // using XTemplate with DV
		}
	    ); 
	},

	buildPolicyDetailsDV : function() {    
            return new Ext.FormPanel(
		{
		    id          : 'policyDetailsId',
		    defaultType : 'textfield',
		    defaults    : { anchor : '100%' }, 
		    border      : false,
		    style       : { "margin-left": "3px" },
		    items       : [
			{ fieldLabel : 'Name',
			  name       : 'name',
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
	},

	onPolicySelected : function() {
            var selectedPolicy = this.getComponent('policyListId').getSelected();
	    if (! selectedPolicy) {
		this.clearDetails();
		return;
	    }

	    // Load details form with values from selected record.
	    var form = Ext.getCmp("policyDetailsId").getForm();
	    form.loadRecord(selectedPolicy);

	    // Handle multiple owners.
 	    var owner = selectedPolicy.get( 'owner' );
	    // Hide trigger button if only one owner available.
	    Ext.getCmp("trigger").setHideTrigger(owner.indexOf(',') == -1);
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
	    var owner = hidden.getValue();
	    var array = owner.split(',');
	    var owner1 = array.shift();
	    array.push(owner1);
	    hidden.setValue(array.join(','));
	    Ext.getCmp("trigger").setValue(owner1);
	    this.showEmail(owner1, 'PolicyEmails');
	},

	clearDetails : function() {
	    var form = this.findById('policyDetailsId').getForm();
	    form.reset();

	    var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
	    dvRules.removeAll();
	    var stUserDetails = Ext.StoreMgr.get('user');
	    stUserDetails.removeAll();
	    this.clearEmail('PolicyEmails');
	    this.clearEmail('UserEmails');
	},

	buildUserDetailsDV : function() {
	    return {
		xtype     : 'userlist',
		region    : 'center',
		proxyurl  : 'get_users',
		id        : 'userListId',
		listeners : {
		    scope : this,
		    selectionchange : this.onUserDetailsSelected
		}
	    };
	},

	onUserDetailsSelected : function() {
            var selectedPolicy =
		this.findById('userListId').getSelected();
	    if (! selectedPolicy) {
		return;
	    }
	    var name = selectedPolicy.get( 'owner' );
	    this.showEmail(name, 'UserEmails');
	},

	showEmail : function(owner, name) {
	    if (! owner) {
		this. clearEmail(name);
 		return;
	    }
	    var emailPanel   = this.findById(name);
	    var store        = emailPanel.getStore();
	    var appstate     = NetspocManager.appstate;
	    var active_owner = appstate.getOwner();
	    var history      = appstate.getHistory();
	    var lastOptions  = store.lastOptions;
	    if ( lastOptions 
		 && lastOptions.params.owner === owner
		 && lastOptions.params.history === history
		 && lastOptions.params.active_owner === active_owner
		 // Reload if data was removed previously.
	         && store.getCount()) 
	    {
		return;
	    }
	    store.load ({ params : { owner : owner } });
	    emailPanel.setTitle('Verantwortliche f&uuml;r ' + owner);
	},

	clearEmail : function(name) {
	    var emailPanel = this.findById(name);
	    var store = emailPanel.getStore();
	    store.removeAll();
	    emailPanel.setTitle('Verantwortliche');
	}

    }
);

Ext.reg( 'policymanager', NetspocManager.PolicyManager );
