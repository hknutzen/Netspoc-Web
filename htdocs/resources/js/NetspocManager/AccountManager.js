
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
            var active_owner, panel, store;
            this.items =  [
                this.buildAdminListPanel(),
                this.buildWatcherListPanel()
            ];
            
            NetspocManager.AccountManager.
		superclass.initComponent.call(this);
            panel = this.findById('AdminEmails');
            store = panel.getStore();
            // Don't set parameter 'owner', use 'active_owner' instead.
            // Otherwise the old owner would be displayed, 
            // if owner is changed later.
            store.load ();
            panel = this.findById('WatcherEmails');
            store = panel.getStore();
            store.load ();
        },

        buildAdminListPanel : function() {
            return {
                id       : 'AdminEmails',
                xtype    : 'emaillist',
		doReload : 1,
                flex     : 1,
                title    : 'Verantwortliche'
            };
        },

        buildWatcherListPanel : function() {
            return {
                id          : 'WatcherEmails',
                xtype       : 'simplelist',
                proxyurl    : 'get_watchers',
                sortInfo    : { field: 'email', direction: 'ASC' },
                hideHeaders : true,
                fieldsInfo  : [ { name : 'email', header : 'x' } ],
                doReload    : 1,
                flex        : 1,
                title       : 'Zuschauer (Watcher)'
            };
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
