
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
            var active_owner, emailPanel, store;
            this.items =  [
                this.buildAdminListPanel()
            ];
            
            NetspocManager.AccountManager.
		superclass.initComponent.call(this);
            active_owner = NetspocManager.appstate.getOwner();
            emailPanel   = this.findById('AdminEmails');
            store        = emailPanel.getStore();
            // Don't set paramter 'owner', use 'active_owner' instead.
            // Otherwise he old owner would be displayed, 
            // if owner is changed later.
            store.load ();
        },

        buildAdminListPanel : function() {
            return {
                id       : 'AdminEmails',
                xtype    : 'emaillist',
		doReload : 1,
                flex     : 1,
                title    : 'Verantwortliche',
            };
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
