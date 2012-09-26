
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
			dataIndex : 'owner_alias',
			width     : .25
		    }
		]
	    };
	},
	
	buildStore : function() {
	    return  {
		xtype         : 'netspocstatestore',
		proxyurl      : this.proxyurl,
		storeId       : 'user',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'name'  , mapping : 'name'  },
		    { name : 'ip'    , mapping : 'ip',
		      sortType : function ( value ) {
			  var m1 = /-/;
			  var m2 = /\//;
			  if ( value.match(m1) ) {
			      var array = value.split('-');
			      return ip2numeric( array[0] );
			  }
			  else if ( value.match(m2) ) {
			      var array = value.split('/');
			      return ip2numeric( array[0] );
			  }
			  else {
			      return ip2numeric( value );
			  }
		      }
		    },
                    // Not shown, but needed to select the corresponding
                    // email addresses.
		    { name : 'owner', mapping : 'owner' },
                    { name : 'owner_alias', 
                      mapping : function (node) { 
                          return node.owner_alias || node.owner;
                      }
                    }
		],
		listeners: {
                    scope : this,
		    load  : this.selectRow0
		}
	    };
	}
	
    }
);

Ext.reg( 'userlist', NetspocWeb.listpanel.UserList );

