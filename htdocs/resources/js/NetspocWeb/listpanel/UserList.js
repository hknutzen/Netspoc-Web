
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.UserList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

NetspocWeb.listpanel.UserList = Ext.extend(
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
			header    : 'IP-Adressen',
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
		storeId       : 'user',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'name'  , mapping : 'name'  },
		    { name : 'ip'    , mapping : 'ip'    },
		    { name : 'owner' , mapping : 'owner' }
		]
	    };
	}
	
    }
);

Ext.reg( 'userlist', NetspocWeb.listpanel.UserList );

