
Ext.ns('NetspocWeb.listpanel');

/**
 * @class NetspocWeb.listpanel.UserList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 * proxyurl : value used by the store
 * fieldsInfo : a combined object, describing
 *  - columns for the listview 
 *    only header, width; 
 *    dataindex is taken fom 'name'
 *  - fields for the store (all other attributes)
 * sortInfo : value used by store
 **/

NetspocWeb.listpanel.Simple = Ext.extend(
    NetspocWeb.listpanel.ListPanelBaseCls,
    {
	buildListView : function() {
            var fields = this.fieldsInfo;
            var columns = [];
            var column, header, width;
            for (var i=0; i < fields.length; i++) {
                header = fields[i].header;
                if (header) {
                    column = { header : header,
                               dataIndex : fields[i].name };
                    width = fields[i].width;
                    if (width) {
                        column.width = width;
                    }
                    columns.push(column);
                }
            }
                    
	    return {
		xtype         : 'listview',
		singleSelect  : true,
		autoScroll    : true,
		store         : this.buildStore(),
		columns       : columns
	    };
	},
	
	buildStore : function() {
            var fields = this.fieldsInfo;
            for (var i=0; i < fields.length; i++) {
                delete fields[i].header;
                delete fields[i].width;
            }
	    return  {
		xtype         : 'netspocstatestore',
		proxyurl      : this.proxyurl,
		sortInfo      : this.sortInfo,
		fields        : fields,
		listeners: {
                    scope : this,
		    load  : this.selectRow0
		}
	    };
	}
	
    }
);

Ext.reg( 'simplelist', NetspocWeb.listpanel.Simple );

