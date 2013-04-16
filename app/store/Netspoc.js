
Ext.define(
    'PolicyWeb.store.Netspoc', {
        extend      : 'Ext.data.Store',
        model       : 'PolicyWeb.model.Netspoc',
        alias       : 'store.netspocstore',
        constructor : function( config ) {
            // Call constructor of superclass.
            this.callParent();
            var proxy;
            var model = Ext.ModelManager.getModel( 'PolicyWeb.model.Netspoc' );
            if ( model ) {
                proxy = model.getProxy();
            }
            if ( config ) {
                if ( config.proxyurl ) {
                    proxy.url = 'backend/' + config.proxyurl;
                }
                if ( config.fields && model ) {
                    model.setFields( config.fields );
                }
            }
            
            this.addListener('beforeload', function ( store, options ) {
                                 Ext.getBody().mask('Daten werden geladen ...', 
                                                    'x-mask-loading');
                                 return true;                   
                             }
                            );
            this.addListener('load', function() { 
                                 Ext.getBody().unmask();
                                 this.isLoaded = true;
                             }
                            );
            this.addListener('exception', this.onJsonException);
            
        },
        onJsonException :
        function(proxy, type, action, options, response, arg ) {
            Ext.getBody().unmask();
            var msg;
            
            // status != 200
            if (type == 'response') {
                try {
                    var jsonData = Ext.decode( response.responseText );
                    msg = jsonData.msg;
                    // The following "if-block" deals with errors in the
                    // framework or in extensions, not with the data returned
                    // from the backend.
                    if ( !msg ) {
                        if ( arg ) {
                            /* arg : Mixed
                             The type and value of this parameter depends
                             on the value of the type parameter:

                             'response' : Error
                             The JavaScript Error object caught if the
                             configured Reader could not read the data.
                             If the remote request returns success===false,
                             this parameter will be null.

                             'remote' : Record/Record[]
                             This parameter will only exist if the action
                             was a write action (Ext.data.Api.actions
                             .create|update|destroy).
                             */
                            msg = arg;
                        }
                    }
                }
                catch (e) {
                    msg = response.statusText;
                }
            }

            // success != true
            else {
                msg = response.msg;
            }
            msg = msg || 'Unbekannter Fehler (keine Meldung)';
            if (msg == 'Login required') {
                Ext.MessageBox.show(
                    { title   : 'Sitzung abgelaufen', 
                      msg     : 'Neu anmelden',
                      buttons : {ok:'OK', cancel:'Abbrechen'},
                      icon    : Ext.MessageBox.WARNING,
                      fn : function (buttonId) {
                          if (buttonId == 'ok') {
                              //PolicyWeb.app.onAfterLogout();
                          }
                      }
                    });
            }
            else {
                Ext.MessageBox.show(
                    { title   : 'Fehler', 
                      msg     : msg,
                      buttons : Ext.MessageBox.OK,
                      icon    : Ext.MessageBox.ERROR
                    });
            }
        }
    }
);

