
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
                    selModel    : this.buildSelModel()
                }
            );
            this.callParent(arguments);
        },
        
        buildSelModel : function() {
            return {
                type : 'rowmodel',
                mode : 'SIMPLE'
            };
        },

        printview : function() {
            Ext.ux.grid.Printer.print( this );
        }
    }
);
