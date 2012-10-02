
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.AccountManager
 * @extends Ext.Container
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype accountmanager
 **/

NetspocManager.AccountManager = Ext.extend(
    Ext.Container,
    {
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildAdminListPanel(),
                this.buildWatcherListPanel(),
                this.buildExtendedByListPanel()
            ];
            
            NetspocManager.AccountManager.
		superclass.initComponent.call(this);

            this.items.each(function (item, index, length) {
                var store = item.getStore();
                store.load ();
            });
        },

        buildAdminListPanel : function() {
            return {
                xtype    : 'emaillist',
		doReload : true,
                flex     : 1,
                title    : 'Verantwortliche'
            };
        },

        buildWatcherListPanel : function() {
            return {
                xtype       : 'simplelist',
                proxyurl    : 'get_watchers',
                hideHeaders : true,
                fieldsInfo  : [ { name : 'email', header : 'x' } ],
                doReload    : true,
                flex        : 1,
                title       : 'Zuschauer (Watcher)'
            };
        },

        buildExtendedByListPanel : function() {
            return {
                xtype       : 'simplelist',
                proxyurl    : 'get_supervisors',
                autoSelect  : 'true',
                hideHeaders : true,
                fieldsInfo  : [ { 
                    name : 'name', 
                    header : 'x',
                    mapping : function (node) { 
                        return node.alias || node.name;
                    }
                } ],
                doReload    : true,
                flex        : 1,
                title       : 'Übergeordnet'
            };
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
