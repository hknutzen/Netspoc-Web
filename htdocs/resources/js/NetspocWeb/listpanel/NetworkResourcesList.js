
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.NetworkResourcesList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

NetspocWeb.listpanel.NetworkResourcesList = Ext.extend(
    NetspocWeb.listpanel.ListPanelBaseCls,
    {
	buildListView : function() {
	    return {
		xtype         : 'listview',
		title         : 'Netzwerk-Ressourcen',
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
	}
    }
);

Ext.reg( 'networkresourceslist', NetspocWeb.listpanel.NetworkResourcesList );

