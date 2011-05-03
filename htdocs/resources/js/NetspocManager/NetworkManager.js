
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
                    },
		    '->',
		    {
			xtype : 'printbutton'
		    }
		]
	    };

	},
	
	buildNetworkDetailsView : function() {
	    return {
		xtype : 'cardprintactive',
		flex           : 2,
		activeItem     : 0,
		deferredRender : false,
		tbar : [
		    {
			text          : 'Enthaltene Ressourcen',
			toggleGroup   : 'containedResourcesGrp',
//			enableToggle  : true,
//			pressed       : true,
			scope         : this,
			handler       : function ( button ) {
			    var cardPanel = button.findParentByType( 'panel' );
			    cardPanel.layout.setActiveItem( 0 );
			}
		    },
		    '->',
		    {
			xtype : 'printbutton'
		    }
		],
		items : [
		    this.buildNetworkDetails()
		]
	    };
	},
	
	buildNetworkDetails : function() {
	    return {
		xtype : 'networkresourceslist'
	    };
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
