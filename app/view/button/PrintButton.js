
/**
 * A class that configures a print-button used in several places.
 **/

Ext.define(
    'PolicyWeb.view.button.PrintButton',
    {
        extend  : 'Ext.button.Button',
        alias   : 'widget.printbutton',
        iconCls : 'icon-printer',
        tooltip : 'Druckansicht für aktuell angezeigte Liste von Diensten (ermöglicht auch das Kopieren von Text)',
        scope   : this,
        handler : function( button ) {
            button.findParentByType('panel').printview();
        }
    }
);