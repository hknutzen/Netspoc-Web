
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.PolicyList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : '/netspoc/' + path
	}
    );
}

NetspocWeb.listpanel.PolicyList = Ext.extend(
    NetspocWeb.listpanel.ListPanelBaseCls,
    {
	buildListView : function() {
	    return {
		xtype         : 'listview',
		singleSelect  : true,
		autoScroll    : true,
		store         : this.buildStore(),
		columns       : [
		    {
			header    : 'Dienstname',
			dataIndex : 'name'
		    }
		]
	    };
	},
	
	buildStore : function() {
	    return  {
		xtype         : 'jsonstore',
		totalProperty : 'totalCount',
		root          : 'records',
		autoLoad      : true,
		remoteSort    : false,
		sortInfo      : { field: 'name', direction: "ASC" },
		storeId       : 'policyDvStoreId',
		proxy         : proxy4path( this.proxyurl ),
		fields        : [
		    { name : 'name',  mapping : 'name'         },
		    { name : 'desc',  mapping : 'description'  },
		    { name : 'ping',  mapping : 'pingallowed'  },
		    { name : 'owner', mapping : 'owner'        }
		],
		listeners : {
		    load : function( thisStore, records, options ) {
			// Select first policy after store has loaded.
		    }
		}
	    };
	}
	
    }
);

Ext.reg( 'policylist', NetspocWeb.listpanel.PolicyList );

