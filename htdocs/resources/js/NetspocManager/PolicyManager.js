
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
			collapseMode: 'mini',
			split       : true,
			header      : false,
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
		{
		    tpl          : dvRulesTpl,
		    store        : store,
		    itemSelector : 'div.thumb-wrap' // OBLIGATORY when
		                                    // using XTemplate with DV
		}
	    ); 
	},

	buildPolicyDetailsDV : function() {
	    var dvDetailsTpl = new Ext.XTemplate(
		'<tpl for=".">',

		'<div class="policy"> {name} </div>',
		'<div class="policy"> {desc} </div>',

		'<div class="ping-and-owner">',
		'<div class="ping-left">   Ping auf Netz erlaubt:   </div>',
		'<div class="owner-right"> Verantwortlich: {owner}  </div>',
		'</div>',

		'</tpl>'   
	    );
    
            return new Ext.DataView(
		{
		    id           : 'dvPolicyDetailsId',
		    tpl          : dvDetailsTpl,
		    itemSelector : 'div.thumb-wrap' // OBLIGATORY when
		                                    // using XTemplate with DV
		}
	    );
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

	onPolicyListClick : function() {
            var selectedPolicy =
		this.getComponent('policyListId').getSelected();
	    if (! selectedPolicy) {
		return;
	    }
	    var name  = selectedPolicy.get( 'name' );
	    var desc  = selectedPolicy.get( 'desc' );
	    var owner = selectedPolicy.get( 'owner' );
	    var ping  = selectedPolicy.get( 'ping' );

	    var arrayData = [
		[ name, desc, ping, owner ]
	    ];
	    var nameRecord = Ext.data.Record.create(
		[
		    {  name : 'name',  mapping : 0  },
		    {  name : 'desc',  mapping : 1  },
		    {  name : 'ping',  mapping : 2  },
		    {  name : 'owner', mapping : 3  }
		]
	    );
	    var arrayReader = new Ext.data.ArrayReader( {}, nameRecord );
	    var memoryProxy = new Ext.data.MemoryProxy( arrayData );
	    var store = new Ext.data.Store(
		{
		    reader : arrayReader,
		    proxy  : memoryProxy
		}
	    );

	    // Load the stores
	    var policyDetails = this.findById('dvPolicyDetailsId');
	    policyDetails.bindStore( store );
	    policyDetails.getStore().reload();

	    var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
	    dvRules.load({ params : { service : name } });
	    
	    var ulv = this.findById('userListId');
	    ulv.loadStoreByParams( { service : name } );
	    var emailstore = Ext.StoreMgr.get('email');
	    emailstore.removeAll();
	},

	clearDetails : function() {
	    var policyDetails = this.findById('dvPolicyDetailsId');
	    var store = policyDetails.getStore();
	    if (store) {
		store.removeAll();
		var dvRules = Ext.StoreMgr.get('dvRulesStoreId');
		dvRules.removeAll();
		var stUserDetails = Ext.StoreMgr.get('user');
		stUserDetails.removeAll();
	    }
	},

	onUserDetailsClick : function() {
            var selectedPolicy =
		this.findById('userListId').getSelected();
	    if (! selectedPolicy) {
		return;
	    }
	    var name = selectedPolicy.get( 'owner' );
	    var store = Ext.StoreMgr.get('email');
	    store.load ({ params : { owner : name } });
	    
	    var emailPanel = this.findById('emailListId');
	    var region = emailPanel.ownerCt.layout.south;
	}

    }
);

Ext.reg( 'policymanager', NetspocManager.PolicyManager );
