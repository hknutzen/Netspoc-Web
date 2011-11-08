
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.WorkflowManager
 * @extends Ext.Container
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype workflowmanager
 **/

NetspocManager.WorkflowManager = Ext.extend(
    Ext.Container,
    {
	border   : false,
	layout   : 'border',
	defaults : {
	    flex : 1
	},

	initComponent : function() {
            this.items =  [
		this.buildNetworkTree(),
		this.buildUsedPolicyList()
            ];
	    
            NetspocManager.WorkflowManager.superclass.initComponent.call(this);
	},
	
	buildNetworkTree : function () {
	    
	    var tree = new Ext.tree.TreePanel( 
		{
		    region          : 'center',
		    useArrows       : true,
		    autoScroll      : true,
		    animate         : false,
		    containerScroll : true,
		    border          : true,
		    enableDrag      : true,
		    loader          : {
			dataUrl   : 'backend/get_net_tree',
			listeners : {
			    beforeload: function(loader, node) {
				var appstate     = NetspocManager.appstate;
				var active_owner = appstate.getOwner();
				var history      = appstate.getHistory();
				loader.baseParams.active_owner = active_owner;
				loader.baseParams.history      = history;
			    },
			    load : function( loader, node, response ) {
				// Expand recursively
				//node.expandChildNodes(true);
			    }
			}
		    },
		    root : {
			id        : 'networksTreeId',
			text      : 'Netze',
			draggable : false
		    }
		}
	    );
	    tree.getRootNode().expand();
	    return tree;
        },

	buildUsedPolicyList : function () {
	    var plv = {
		region   : 'east',
		width    : 400,
		xtype    : 'policylist',
		proxyurl : 'service_list'

	    };
	    return plv;
	},

	toggleNameIP : function() {
	    console.info( 'TOGGLE' );
	}
    }
);

Ext.reg( 'workflowmanager', NetspocManager.WorkflowManager );
