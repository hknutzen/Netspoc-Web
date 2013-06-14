
/**
 * A base class that contains the reusable bits of configuration
 * for Grids.
 **/

Ext.define(
    'PolicyWeb.view.panel.grid.Abstract',
    {
        extend : 'Ext.grid.Panel',
        alias  : 'widget.abstractgrid',
        
        initComponent : function() {
            Ext.apply(
                this, {
                    selModel    : this.buildSelModel(),
                    viewConfig  : this.buildViewConfig(),
                    defaults    : this.buildDefaults()
                }
            );
            this.callParent(arguments);
        },
        
        buildSelModel : function() {
            return {
                type : 'rowmodel',
                mode : 'SINGLE'
            };
        },

        buildDefaults : function() {
            return {
                menuDisabled : true
            };
        },

        buildViewConfig : function() {
            return {
                selectedRowClass : 'x-grid3-row-over',
                loadMask         : false
            };
        },

        printview : function() {
            Ext.ux.grid.Printer.print( this );
        }
    }
);
