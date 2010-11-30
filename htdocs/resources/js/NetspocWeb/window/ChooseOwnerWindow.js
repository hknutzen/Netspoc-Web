Ext.ns("NetspocWeb.window");

/**
 * @class NetspocWeb.window.UserLoginWindow
 * @extends Ext.Window
 * A class to manage user logins
 * @constructor
 */
NetspocWeb.window.ChooseOwnerWindow = Ext.extend(
    Ext.Window, {
	/**
	 * @cfg scope [Object} A refrence to the handler scope
	 */
	/**
	 * @cfg handler {Object} A reference to a method to be
	 *  called to process the login
	 */
	/**
	 * @private
	 * Configures the component, enforcing defaults
	 */
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

	    Ext.Ajax.request(
		{
		    url          : 'http://10.3.28.111/netspoc/get_owner',
		    scope        : this,
		    callback     : NetspocWeb.onAfterAjaxReq,
		    succCallback : this.onAfterGetOwner
		}
	    );
	    
            return {
		xtype       : 'form',
		defaultType : 'textfield',
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



