
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.EmailList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

NetspocWeb.listpanel.EmailList = Ext.extend(
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
			header    : 'Verantwortliche',
			dataIndex : 'email'
		    }
		]
	    };
	},
	
	buildStore : function() {
	    return  {
		xtype         : 'netspocstore',
		proxyurl      : this.proxyurl,
		storeId       : 'email',
		sortInfo      : { field: 'email', direction: "ASC" },
		fields        : [
		    { name : 'email',  mapping : 'email' }
		]
	    };
	}
	
    }
);

Ext.reg( 'emaillist', NetspocWeb.listpanel.EmailList );

