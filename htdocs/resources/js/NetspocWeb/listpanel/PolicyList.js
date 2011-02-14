
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.PolicyList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

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
		xtype         : 'netspocstore',
		proxyurl      : this.proxyurl,
		storeId       : 'policyDvStoreId',
		sortInfo      : { field: 'name', direction: "ASC" },
		fields        : [
		    { name : 'name',  mapping : 'name'         },
		    { name : 'desc',  mapping : 'description'  },
		    { name : 'ping',  mapping : 'pingallowed'  },
		    { name : 'owner', mapping : 'owner'        }
		]
	    };
	}
	
    }
);

Ext.reg( 'policylist', NetspocWeb.listpanel.PolicyList );

