
Ext.ns("NetspocManager");

function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : '/netspoc/' + path
	}
    );
}

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
	defaults : {
//	    layout : 'fit',
            flex   : 1
	},

	initComponent : function() {
            this.items =  [
		this.buildPolicyListPanel(),
		this.buildPolicyDetailsView()
            ];
	    
            NetspocManager.PolicyManager.superclass.initComponent.call(this);
	},
	
	buildPolicyListPanel : function() {
            return {
		xtype    : 'policylist',
		proxyurl : 'service_list',
		itemId   : 'policyListId',
		width    : 300,
		border   : false,
		listeners : {
                    scope : this,
                    click : this.onPolicyListClick
		},
		tbar      :  [
                    {
			text         : 'Alle Dienste',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			pressed      : true,
			scope        : this,
			handler      : function() {
			    var plv =  this.getComponent('policyListId');
			    plv.loadStoreByParams( {} );
			}
                    },
                    {
			text         : 'Eigene',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			scope        : this,
			handler      : function() {
			    var plv =  this.getComponent('policyListId');
			    plv.loadStoreByParams( { relation : 'owner' } );
			}
                    },
                    {
			text         : 'Genutzte',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			scope        : this,
			handler      : function() {
			    var plv =  this.getComponent('policyListId');
			    plv.loadStoreByParams( { relation : 'user' } );
			}
                    },
                    {
			text         : 'Sichtbare',
			toggleGroup  : 'polNavBtnGrp',
			enableToggle : true,
			scope        : this,
			handler      : function() {
			    var plv =  this.getComponent('policyListId');
			    plv.loadStoreByParams( { relation : 'visible' } );
			}
                    }
		]
	    };

	},
	
	buildPolicyDetailsView : function() {
            return {
		id        : 'pCenterId',
		xtype     : 'tabpanel',
		flex      : 2.5,
		activeTab : 0,
		items     : [
		    {
			title  : 'Details des '
			    + 'ausgew&auml;hlten'
			    + ' Diensts',
			xtype  : 'panel',
			layout : 'anchor',
			autoScroll : true,
			items  : [
			    this.buildPolicyDetailsDV(),
			    this.buildPolicyRulesDV()
			]
		    },
		    {
			title  : 'IP-Adressen hinter User',
			xtype  : 'panel',
			layout : 'fit',
			items  : [
				this.buildUserDetailsDV()
			]
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
    
	    var dvRulesStore = {
		xtype    : 'jsonstore',
		root     : 'records',
		autoLoad : false,
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
		    tpl        : dvRulesTpl,
		    store      : dvRulesStore
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
		    id  : 'dvPolicyDetailsId',
		    tpl : dvDetailsTpl
		}
	    );
	},

	buildUserDetailsDV : function() {
	    var stUserLv = {
		id            : 'stUserLvId',
		xtype         : 'jsonstore',
		totalProperty : 'totalCount',
		root          : 'records',
		autoLoad      : false,
		remoteSort    : false,
		sortInfo      : { field: 'ip', direction: "ASC" },
		storeId       : 'stUserLvId',
		fields        : [
		    { name : 'ip', mapping : 'ip'        }
		],
		listeners : {
		    load : function( thisStore, records, options ) {
			var lvUserIPs =
			    Ext.getCmp('lvUserId');
			// Select first policy after store has loaded.
			lvUserIPs.select( 0 );
		    }
		}
	    };

	    return new Ext.ListView(
		{
		    id            : 'lvUserId',
		    store         : stUserLv,
		    singleSelect  : true,
		    boxMinWidth   : 200,
		    columns       : [
			{
			    header    : 'IP-Adressen',
			    dataIndex : 'ip'
			}
		    ]
		}
	    );
	},

	onPolicyListClick : function() {
            var selectedPolicy =
		this.getComponent('policyListId').getSelected();

	    var name   = selectedPolicy.get( 'name' );
	    var desc   = selectedPolicy.get( 'desc' );
	    var owner  = selectedPolicy.get( 'owner' );
	    var ping   = selectedPolicy.get( 'ping' );

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
	    var arrayReader = new Ext.data.ArrayReader(
		{}, nameRecord );
	    var memoryProxy  = new Ext.data.MemoryProxy(
		arrayData );
	    var store = new Ext.data.Store(
		{
		    reader : arrayReader,
		    proxy  : memoryProxy
		}
	    );

	    // Now load the stores of policy-details-dataview and
	    // of policy-rules-dataview.
	    var policyDetails = this.findById('dvPolicyDetailsId');
	    policyDetails.bindStore( store );
	    policyDetails.getStore().reload();

	    var dvRules =
		Ext.StoreMgr.get('dvRulesStoreId');
	    var url = 'get_rules?service=' + name;
	    var rulesProxy = proxy4path( url );
	    dvRules.proxy = rulesProxy;
	    dvRules.load();
	    
	    var stUserDetails =
		Ext.StoreMgr.get('stUserLvId');
	    url = 'get_user?service=' + name;
	    stUserDetails.proxy = proxy4path( url );
	    stUserDetails.load();
	}
    }
);

Ext.reg( 'policymanager', NetspocManager.PolicyManager );
