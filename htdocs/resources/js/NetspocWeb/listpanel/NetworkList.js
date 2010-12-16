
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.NetworkList
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

NetspocWeb.listpanel.NetworkList = Ext.extend(
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
			header    : 'IP-Adresse des Netzes',
			dataIndex : 'ip'
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
		storeId       : 'networkDvStoreId',
		proxy         : proxy4path( this.proxyurl ),
		fields        : [
		    { name : 'name', mapping : 'name' },
		    { name : 'ip',   mapping : 'ip'   }
		],
		listeners : {
		    load : function( thisStore, records, options ) {
			// Select first item after store has loaded.
		    }
		}
	    };
	}
	
    }
);

Ext.reg( 'networklist', NetspocWeb.listpanel.NetworkList );

