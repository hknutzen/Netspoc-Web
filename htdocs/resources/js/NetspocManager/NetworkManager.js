
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
		width    : 400,
		border   : false,
		listeners : {
                    scope : this,
                    click : this.onNetworkListClick
		},
		tbar      :  [
                    {
			text         : 'Netze/Hosts',
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
		flex      : 2.5,
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
		xtype         : 'netspocstore',
		autoLoad      : false,
		storeId       : 'stNetworkDetailsId',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'ip',   mapping : 'ip'        },
		    { name : 'name', mapping : 'name'      }
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
			    dataIndex : 'ip'
			},
			{
			    header    : 'Name',
			    dataIndex : 'name'
			}
		    ]
		}
	    );
	},

	onNetworkListClick : function() {
            var selectedNetwork =
		this.getComponent('networkListId').getSelected();
	    var name  = selectedNetwork.get( 'name' );
	    var store = Ext.StoreMgr.get('stNetworkDetailsId');
	    var url = 'get_hosts?network=' + name;
	    store.proxy = proxy4path( url );
	    store.load();
	}
    }
);

Ext.reg( 'networkmanager', NetspocManager.NetworkManager );
