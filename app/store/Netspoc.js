
Ext.define(
    'PolicyWeb.store.Netspoc', {
        extend      : 'Ext.data.Store',
        model       : 'PolicyWeb.model.Netspoc',
        alias       : 'store.netspocstore',
        autoLoad    : false,
        constructor : function( config ) {
            var url = '';
            var proxy;
            if ( config ) {
                if ( config.proxyurl ) {
                    url = 'backend/' + config.proxyurl;
                    console.log( 'Set proxyurl to: ' + url );
                    proxy = {
                        type       : 'ajax',
                        url        : url,
                        pageParam  : false, //to remove param "page"
                        startParam : false, //to remove param "start"
                        limitParam : false, //to remove param "limit"
                        noCache    : false, //to remove param "_dc<xyz>"
                        reader : {
                            type            : 'json',
                            root            : 'records',
                            totalProperty   : 'totalCount',
                            successProperty : 'success'
                        }
                    };
                    this.setProxy( proxy );
                }
            }
            else {
                console.log( 'NETSPOC STORE WITHOUT CONFIG!' );
                //debugger;
            }

            // Call constructor of superclass.
            this.callParent( config );

/*
            var proxy = this.getProxy();
            //console.dir( proxy );
            var model = proxy.getModel();
            if ( config ) {
                if ( config.proxyurl ) {
                    console.log( 'Set proxyurl to: ' + config.proxyurl );
                    proxy.url = 'backend/' + config.proxyurl;
                }
                if ( model && config.fields ) {
                    model.setFields( config.fields );
                }
            }
            else {
                //alert( 'NETSPOC STORE WITHOUT CONFIG!' );
            }
*/
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

