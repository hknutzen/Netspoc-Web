
Ext.ns('NetspocWeb.button');

/* 
 * 
 * Extend Button class to fire up print dialogue window.
 * 
 */

//var global_print_wnd = false;

NetspocWeb.button.PrintButtonXT = Ext.extend(
    Ext.Button, {
	initComponent : function() {
            NetspocWeb.button.PrintButtonXT.
		superclass.initComponent.call(this);
	},	    
	iconCls : 'icon-printer',
	tooltip : 'Druck-Fenster öffnen',
	scope   : this,
	handler : function( button ) {
	    console.log( "XT" );
	}
    }
);

Ext.reg( 'printbuttonxt', NetspocWeb.button.PrintButtonXT );
