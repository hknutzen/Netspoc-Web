
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
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
