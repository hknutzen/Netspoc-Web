
Ext.ns("NetspocManager");

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

	initComponent : function() {
            this.items =  [
		this.buildNetworkListPanel(),
		this.buildNetworkDetailsView()
            ];
	    
            NetspocManager.NetworkManager.superclass.initComponent.call(this);
	    var view =  this.getComponent('networkListId');
	    view.loadStoreByParams( {} );
	},
	
	buildNetworkListPanel : function() {
            return {
		xtype    : 'networklist',
		proxyurl : 'get_networks',
		itemId   : 'networkListId',
		flex     : 2,
		border   : false,
		listeners : {
                    scope : this,
                    selectionchange : this.onNetworkListSelected
		},
		tbar      :  [
                    {
			text         : 'Netze',
			toggleGroup  : 'netRouterGrp',
			enableToggle : true,
			pressed      : true,
			scope        : this,
			handler      : function() {
			    //this.proxyurl = 'get_networks'
			}
                    },
                    {
			text         : 'Router',
			toggleGroup  : 'netRouterGrp',
			enableToggle : true,
			scope        : this,
			handler : function() {
			    //this.proxyurl = 'get_router'
			}
                    }
		]
	    };

	},
	
	buildNetworkDetailsView : function() {
            return {
		xtype     : 'tabpanel',
		flex      : 2,
		activeTab : 0,
		items     : [
		    {
			title  : 'Enthaltene Ressourcen',
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
	    var store = {
		xtype         : 'netspocstatestore',
		proxyurl      : 'get_hosts',
		storeId       : 'stNetworkDetailsId',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'ip',     mapping : 'ip'    },
		    { name : 'name',   mapping : 'name'  },
		    { name : 'owner' , mapping : 'owner' }
		]
	    };

	    return new Ext.ListView(
		{
		    id            : 'lvNetworkDetailsId',
		    store         : store,
		    singleSelect  : true,
		    boxMinWidth   : 200,
		    columns       : [
			{
			    header    : 'IP-Adresse',
			    dataIndex : 'ip',
			    width     : .25
			},
			{
			    header    : 'Name',
			    dataIndex : 'name'
			},
			{
			    header    : 'Verantwortungsbereich',
			    dataIndex : 'owner',
			    width     : .25
			}
		    ]
		}
	    );
	},

	onNetworkListSelected : function() {
            var selectedNetwork =
		this.getComponent('networkListId').getSelected();
	    var store = Ext.StoreMgr.get('stNetworkDetailsId');
	    if (selectedNetwork) {
		var name  = selectedNetwork.get( 'name' );
		store.load({ params : { network : name } });		
	    }
	    else {
		store.removeAll();
	    }
	}
    }
);

Ext.reg( 'networkmanager', NetspocManager.NetworkManager );
