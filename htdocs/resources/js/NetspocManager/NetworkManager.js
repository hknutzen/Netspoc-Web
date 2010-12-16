
Ext.ns("NetspocManager");

function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : '/netspoc/' + path
	}
    );
}

/**
 * @class NetspocManager.NetworkManager
 * @extends Ext.Panel
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype policymanager
 **/

NetspocManager.NetworkManager = Ext.extend(
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
		this.buildNetworkListPanel(),
		this.buildNetworkDetailsView()
            ];
	    
            NetspocManager.NetworkManager.superclass.initComponent.call(this);
	},
	
	buildNetworkListPanel : function() {
            return {
		xtype    : 'networklist',
		proxyurl : 'get_networks',
		itemId   : 'networkListId',
		width    : 300,
		border   : false,
		listeners : {
                    scope : this,
                    click : this.onNetworkListClick
		}
	    };

	},
	
	buildNetworkDetailsView : function() {
            return {
		xtype     : 'tabpanel',
		flex      : 2.5,
		activeTab : 0,
		items     : [
		    {
			title  : 'In ausgew&auml;hltem Netz '
			    + ' enthaltene Hosts',
			xtype  : 'panel',
			layout : 'anchor',
			autoScroll : true,
			items  : [
			    this.buildNetworkDetails()
			]
		    }
		]
            };
	},
	
	buildNetworkDetails : function() {
	    var stNetworkLv = {
		xtype         : 'jsonstore',
		totalProperty : 'totalCount',
		root          : 'records',
		autoLoad      : false,
		remoteSort    : false,
		sortInfo      : { field: 'ip', direction: "ASC" },
		storeId       : 'stNetworkDetailsId',
		fields        : [
		    { name : 'ip',   mapping : 'ip'        },
		    { name : 'name', mapping : 'name'      }
		]
	    };

	    return new Ext.ListView(
		{
		    id            : 'lvNetworkDetailsId',
		    store         : stNetworkLv,
		    singleSelect  : true,
		    boxMinWidth   : 200,
		    columns       : [
			{
			    header    : 'IP-Adresse',
			    dataIndex : 'ip'
			},
			{
			    header    : 'Name',
			    dataIndex : 'ip'
			}
		    ]
		}
	    );
	},

	onNetworkListClick : function() {
            var selectedNetwork =
		this.getComponent('policyListId').getSelected();

	    var name   = selectedNetwork.get( 'name' );
	    var desc   = selectedNetwork.get( 'desc' );
	    var owner  = selectedNetwork.get( 'owner' );
	    var ping   = selectedNetwork.get( 'ping' );

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
	    var policyDetails = this.findById('dvNetworkDetailsId');
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
	},

	cleanSlate : function () {
	    this.getComponent('networkListId').refreshView();
	}
    }
);

Ext.reg( 'networkmanager', NetspocManager.NetworkManager );
