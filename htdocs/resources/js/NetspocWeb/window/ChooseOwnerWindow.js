Ext.ns("NetspocWeb.window");

/**
 * @class NetspocWeb.window.ChooseOwnerWindow
 * @extends Ext.Window
 * A class to manage choice of owner to use after being logged in.
 * @constructor
 */
NetspocWeb.window.ChooseOwnerWindow = Ext.extend(
    Ext.Window, {

	initComponent : function() {
            // Force defaults
            Ext.apply( this,
		       {
			   width     : 400,
			   height    : 125,
			   modal     : true,
			   draggable : false,
			   title     : 'Verantwortungsbereich ausw&auml;hlen',
			   layout    : 'fit',
			   center    : true,
			   closable  : false,
			   resizable : false,
			   border    : false,
			   items     : this.buildForm(),
			   buttons   : [
			       {
				   text    : 'Ausw&auml;hlen',
				   handler : this.handler || Ext.emptyFn,
				   scope   : this.scope || this
			       }
			   ]
		       }
		     );
	    
            NetspocWeb.window.ChooseOwnerWindow.superclass.initComponent.call(this);
	},
	//private builds the form.
	buildForm : function() {

            var formItemDefaults = {
		allowBlank : false,
		anchor     : '-5'
            };

            return {
		xtype       : 'form',
		labelWidth  : 150,
		frame       : true,
		labelAlign  : 'right',
		defaults    : formItemDefaults,
		items       : [] //combo
            };
	},

	onAfterGetOwner : function( jsonData ) {
	    Ext.Msg.show(
		{
		    title   : 'After get owner',
		    msg     : msg,
		    buttons : Ext.Msg.OK,
		    fn      : function() {},
		    icon    : Ext.Msg.INFO
		}
	    );
/*
	    combo = {
		xtype        : 'combo',
		fieldLabel   : 'Select a name',
		store        : mySimpleStore,
		displayField : 'name',
		typeAhead    : true,
		mode         : 'local'
	    };	    
*/
	}
    }
);



