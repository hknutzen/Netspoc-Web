
Ext.ns('NetspocWeb.listpanel');

/**
 * @class NetspocWeb.listpanel.UserList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 * fieldsInfo : a combined object, describing
 *  - columns for the listview 
 *    only header, width; 
 *    dataindex is taken fom 'name'
 *  - fields for the store (all other attributes)
 * proxyurl : value is used by the store
 * sortInfo : value is used by store
 * doReload : values is used by store
 * hideHeaders : value is forwarded to listview
 * autoSelect  : first loaded record is selected
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
                columns       : columns,
                hideHeaders   : this.hideHeaders
            };
        },
        
        buildStore : function() {
            var listeners;
            var fields = this.fieldsInfo;
            for (var i=0; i < fields.length; i++) {
                delete fields[i].header;
                delete fields[i].width;
            }
            if (this.autoSelect) {
                listeners = {
                    scope : this,
                    load  : this.selectRow0
                };
            }
            return  {
                xtype         : 'netspocstatestore',
                proxyurl      : this.proxyurl,
                sortInfo      : this.sortInfo,
                doReload      : this.doReload,
                fields        : fields,
                listeners     : listeners
            };
        }
        
    }
);

Ext.reg( 'simplelist', NetspocWeb.listpanel.Simple );

