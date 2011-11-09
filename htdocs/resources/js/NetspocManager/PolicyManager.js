
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
	    var plv = this.getComponent('policyListId');
	    var fn = function () {
		plv.loadStoreByParams( { relation : 'user' } );
	    };
	    // Give IE some time to digest store loading and stuff,
	    // so that it doesn't hickup.
	    if ( Ext.isIE ) {
		Ext.defer( fn, 10 );
	    }
	    else {
		fn();
	    }
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
			allowDepress : false,
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
	    var plv        = this.getComponent('policyListId');
	    var relation   = button.relation;
	    var params     = button.search_params;
	    var keep_front = false;
	    
	    if ( params ) {
		keep_front = params.keep_front;
	    }
	    
	    if ( search_window && !keep_front ) {
		search_window.hide();
	    }
	    if ( relation ) {
		params = { relation : relation };
	    }
	    plv.loadStoreByParams(params);
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

	    var store = {
		xtype    : 'netspocstatestore',
		proxyurl : 'get_rules',
		storeId  : 'dvRulesStoreId',
		fields   : [
		    { name : 'has_user', mapping : 'hasuser'  },
		    { name : 'action',   mapping : 'action'  },
		    { name : 'src',      mapping : function( node ) {
			  if ( node.has_user == 'src' || node.has_user == 'both' ) {
			      return '<span style="font-weight:bold;"> User </span>';
			  }
			  else {
			      return node.src.join( '<br>' );
			  };
		      }
		    },
		    { name : 'dst',      mapping : function( node ) {
			  if ( node.has_user == 'dst' || node.has_user == 'both' ) {
			      return '<span style="font-weight:bold;"> User </span>';
			  }
			  else {
			      return node.dst.join( '<br>' );
			  };
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
