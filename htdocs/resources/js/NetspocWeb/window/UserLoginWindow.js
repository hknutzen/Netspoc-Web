Ext.ns("NetspocWeb.window");

/**
 * @class NetspocWeb.window.UserLoginWindow
 * @extends Ext.Window
 * A class to manage user logins
 * @constructor
 */
NetspocWeb.window.UserLoginWindow = Ext.extend(Ext.Window, {
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
        Ext.apply(this, {
            width     : 350,
            height    : 125,
            modal     : true,
            draggable : false,
            title     : 'Anmeldung am Netspoc-Webinterface',
            layout    : 'fit',
            center    : true,
            closable  : false,
            resizable : false,
            border    : false,
            items     : this.buildForm(),
            buttons   : [
                {
                    text    : 'Anmelden',
                    handler : this.handler || Ext.emptyFn,
                    scope   : this.scope || this
                }
            ]
        });

        NetspocWeb.window.UserLoginWindow.superclass.initComponent.call(this);
    },
    //private builds the form.
    buildForm : function() {

        var formItemDefaults = {
            allowBlank : false,
            anchor     : '-5',
            listeners  : {
                scope      : this,
                specialkey : function(field, e) {
                    if ( e.getKey() === e.ENTER && this.handler ) {
                        this.handler.call( this.scope );
                    }
                }
            }
        };

        return {
            xtype       : 'form',
            defaultType : 'textfield',
            labelWidth  : 100,
            frame       : true,
            url         : '/netspoc/login',
            labelAlign  : 'right',
            defaults    : formItemDefaults,
            items       : [
                {
                    fieldLabel : 'Benutzername',
                    name       : 'user'
                },
                {
                    inputType  : 'password',
                    fieldLabel : 'Passwort',
                    name       : 'password'
                }
            ]
        };
    }

});