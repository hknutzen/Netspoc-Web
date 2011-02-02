
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.NetworkList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

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
			header    : 'IP-Adresse des Netzes/Hosts',
			dataIndex : 'ip'
		    },
		    {
			header    : 'Name',
			dataIndex : 'name'
		    }
		]
	    };
	},
	
	buildStore : function() {
	    return  {
		xtype         : 'netspocstore',
		proxyurl      : this.proxyurl,
		storeId       : 'networkDvStoreId',
		sortInfo      : { field: 'ip', direction: "ASC" },
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

