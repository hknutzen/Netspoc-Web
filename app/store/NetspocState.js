
function getConstructor ( supercls, alias ) {
    var class_name = Ext.getClassName( supercls );
    console.log( class_name );
    var constructor = {
        extend      : class_name,
        alias       : alias,
        constructor : function(config) {
            config = Ext.apply(config,
                      {
                          totalProperty : 'totalCount',
                          successProperty : 'success',
                          root          : 'records',
                          remoteSort    : false,
                          url           : 'backend/' + config.proxyurl
                      });

            // Call constructor of superclass.
            supercls.call(this, config);
            this.addListener('beforeload', function ( store, options ) {
                                 Ext.getBody().mask('Daten werden geladen ...', 
                                                    'x-mask-loading');
                                 return true;                   
                             });
            this.addListener('load', function() { 
                Ext.getBody().unmask();
                this.isLoaded = true;
            });
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
                              PolicyWeb.app.onAfterLogout();
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
    };
    return constructor;
}

function getStateConstructor ( supercls, alias ) {
    var class_name = Ext.getClassName( supercls );
    console.log( class_name );
    var constructor = {
        extend      : class_name,
        alias       : alias,
        constructor : function(config) {

            // Call constructor of superclass.
            supercls.call(this, config);

            // Set baseParams and reload store if appstate changes.
            this.changeBaseParams();
            PolicyWeb.app.globals.appstate.addListener(
                'changed', 
                function () {
                    this.changeBaseParams();
                    if (this.doReload && this.isLoaded) {
                        // Update copy of baseParams stored in lastOptions.
                        Ext.apply(this.lastOptions.params, this.baseParams);
                        this.reload();
                    }
                }, this);
        },
        changeBaseParams : function() {
            var appstate = PolicyWeb.app.globals.appstate;
            this.setBaseParam('active_owner', appstate.getOwner());
            this.setBaseParam('history', appstate.getHistory());
            this.setBaseParam('chosen_networks', appstate.getNetworks());
        }
    };
    return constructor;
}

//FOO
Ext.define(
    'PolicyWeb.store.Netspoc',
    (getConstructor(Ext.data.JsonStore, 'store.netspocstore'))
);

Ext.define(
    'PolicyWeb.store.NetspocState',
    (getStateConstructor(PolicyWeb.store.Netspoc, 'store.netspocstatestore' ))
);

/*
Ext.define(
    'PolicyWeb.store.NetspocGroup', {
        extend      : 'Ext.data.JsonStore',
        constructor : (getConstructor(Ext.data.JsonStore)),
        alias       : 'store.netspocgroupstore'
    }
);

Ext.define(
    'PolicyWeb.store.NetspocGroupState', {
        extend      : 'PolicyWeb.store.NetspocGroup',
        constructor : (getStateConstructor(PolicyWeb.store.NetspocGroup)),
        alias       : 'store.groupingstatestore'
    }
);
*/
