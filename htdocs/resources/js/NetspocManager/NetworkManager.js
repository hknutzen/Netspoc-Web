
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
		},
		tbar      :  [
                    {
			text    : 'Netze/Hosts',
			scope   : this,
			handler : function() {
//			    var plv =  this.getComponent('policyListId');
//			    plv.loadStoreByParams( { relation : 'owner' } );
			}
                    },
                    {
			text    : 'Router',
			scope   : this,
			handler : function() {
//			    var plv =  this.getComponent('policyListId');
//			    plv.loadStoreByParams( { relation : 'user' } );
			}
                    }
		]
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
		this.getComponent('networkListId').getSelected();

	    console.log( "Selected: " + selectedNetwork.data.name );	    
	    var stUserDetails =
		Ext.StoreMgr.get('stNetworkDetailsId');
//	    var url = 'get_user?service=' + name;
//	    stUserDetails.proxy = proxy4path( url );
//	    stUserDetails.load();
	},

	cleanSlate : function () {
	    this.getComponent('networkListId').refreshView();
	}
    }
);

Ext.reg( 'networkmanager', NetspocManager.NetworkManager );
