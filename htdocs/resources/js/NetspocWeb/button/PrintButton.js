
Ext.ns('NetspocWeb.button');

/* 
 * 
 * Extend Button class to handle printing of parent panel containing a listview.
 * 
 */


NetspocWeb.button.PrintButton = Ext.extend(
    Ext.Button, {
        initComponent : function() {
            NetspocWeb.button.PrintButton.
                superclass.initComponent.call(this);
        },          
        iconCls : 'icon-printer',
        tooltip : 'Druckansicht (ermöglicht auch das Kopieren von Text)',
        scope   : this,
        handler : function( button ) {
            button.findParentByType('panel').printView();
        }
    }
);

Ext.reg( 'printbutton', NetspocWeb.button.PrintButton );
