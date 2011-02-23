
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
                    click : this.onPolicyListClick
		},
		tbar      :  [
                    {
			text         : 'Eigene',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			storeParams  : { relation : 'owner' },
			scope        : this,
			handler      : this.onButtonClick
                    },
                    {
			text         : 'Genutzte',
			toggleGroup  : 'polNavBtnGrp',
			pressed      : true,
			enableToggle : true,
			storeParams  : { relation : 'user' },
			scope        : this,
			handler      : this.onButtonClick
                    },
                    {
			text         : 'Nutzbare',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			storeParams  : { relation : 'visible' },
			scope        : this,
			handler      : this.onButtonClick
                    },
                    {
			text         : 'Alle',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			storeParams  : {},
			scope        : this,
			handler      : this.onButtonClick
                    }
		]
	    };

	},
	
	onButtonClick :  function(button, event) {
	    var plv =  this.getComponent('policyListId');
	    plv.loadStoreByParams( button.storeParams );
	    this.clearDetails();
	},

	buildPolicyDetailsView : function() {
            return {
		xtype  : 'container',
		layout : 'border',
		flex   : 2,
		items  : [
		    {
			id        : 'pCenterId',
			xtype     : 'tabpanel',
			region    : 'center',
			activeTab : 0,
			items     : [
			    {
				title  : 'Details zum Dienst',
				xtype  : 'panel',
				layout : 'anchor',
				autoScroll : true,
				items  : [
				    this.buildPolicyDetailsDV(),
				    this.buildPolicyRulesDV()
				]
			    },
			    {
				title  : 'Benutzer (User) des Dienstes',
				xtype  : 'panel',
				layout : 'fit',
				items  : [
				    this.buildUserDetailsDV()
				]
			    }
			]		    
		    },
		    {
			id          : 'emailListId',
			xtype       : 'emaillist',
			proxyurl    : 'get_emails',
			title       : 'Verantwortliche',
			region      : 'south',
			collapsible : true,
//			collapseMode: 'mini',
			split       : true,
//			header      : false,
//			collapsed   : true,
			height      : 68
		    }
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
		xtype    : 'netspocstore',
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
		    id    : 'policyDetailsId',
		    defaultType: 'textfield',
		    defaults: {anchor : '100%' }, 
		    border: false,
		    style: { "margin-left": "3px" },
		    items : [
			{ fieldLabel: 'Name', name : 'name', readOnly : true },
			{ fieldLabel: 'Beschreibung', name : 'desc', readOnly : true },
			{ xtype : 'hidden', id: 'hiddenOwner', name : 'owner' },
			{ xtype : 'trigger',
			  id    : 'trigger',
			  fieldLabel: 'Verantwortung',
			  name      : 'owner1',
			  editable  : false,
			  onTriggerClick : this.bind(this.onTriggerClick)
			}
		    ]
		}
	    );
	},

	onPolicyListClick : function() {
            var selectedPolicy = this.getComponent('policyListId').getSelected();
	    if (! selectedPolicy) {
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
	    this.showEmail(owner1);
	},

	clearDetails : function() {
	    var policyDetails = this.findById('dvPolicyDetailsId');
	    if (! policyDetails) {
		return;
	    }
	    var store = policyDetails.getStore();
	    if (store) {
		store.removeAll();
		var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
		dvRules.removeAll();
		var stUserDetails = Ext.StoreMgr.get('user');
		stUserDetails.removeAll();
	    }
	},

	buildUserDetailsDV : function() {
	    return {
		xtype     : 'userlist',
		proxyurl  : 'get_user',
		id        : 'userListId',
		listeners : {
		    scope : this,
		    click : this.onUserDetailsClick
		}
	    };
	},

	onUserDetailsClick : function() {
            var selectedPolicy =
		this.findById('userListId').getSelected();
	    if (! selectedPolicy) {
		return;
	    }
	    var name = selectedPolicy.get( 'owner' );
	    this.showEmail(name);
	},

	showEmail : function(owner) {
	    var store = Ext.StoreMgr.get('email');
	    store.load ({ params : { owner : owner } });
	    
	    var emailPanel = this.findById('emailListId');
	    emailPanel.setTitle('Vertwortliche f&uuml;r ' + owner);
//	    var region = emailPanel.ownerCt.layout.south;
	}

    }
);

Ext.reg( 'policymanager', NetspocManager.PolicyManager );
