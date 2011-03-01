
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
	    };
	},
	
	buildStore : function() {
	    return  {
		xtype         : 'netspocstore',
		proxyurl      : this.proxyurl,
		storeId       : 'networkDvStoreId',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'name',   mapping : 'name'  },
		    { name : 'ip',     mapping : 'ip'    },
		    { name : 'owner' , mapping : 'owner' }
		],
		listeners: {
                    scope : this,
		    load  : this.selectRow0
		}
	    };
	}
	
    }
);

Ext.reg( 'networklist', NetspocWeb.listpanel.NetworkList );

