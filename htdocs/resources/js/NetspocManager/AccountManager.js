
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
                id       : 'Admins',
                xtype    : 'emaillist',
		doReload : 1,
                flex     : 1,
                title    : 'Verantwortliche'
            };
        },

        buildWatcherListPanel : function() {
            return {
                id          : 'Watchers',
                xtype       : 'simplelist',
                proxyurl    : 'get_watchers',
                hideHeaders : true,
                fieldsInfo  : [ { name : 'email', header : 'x' } ],
                doReload    : 1,
                flex        : 1,
                title       : 'Zuschauer (Watcher)'
            };
        },

        buildExtendedByListPanel : function() {
            return {
                id          : 'Supervisors',
                xtype       : 'simplelist',
                proxyurl    : 'get_supervisors',
                hideHeaders : true,
                fieldsInfo  : [ { 
                    name : 'name', 
                    header : 'x',
                    mapping : function (node) { 
                        return node.alias || node.name;
                    }
                } ],
                doReload    : 1,
                flex        : 1,
                title       : 'Übergeordnet'
            };
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
