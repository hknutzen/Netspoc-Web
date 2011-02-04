Ext.ns('NetspocWeb.store');

NetspocWeb.store.Netspoc = Ext.extend(
    Ext.data.JsonStore,
    {
	constructor : function(config) {
	    config = Ext.apply(config,
		      {
    			  totalProperty : 'totalCount',
			  successProperty : 'success',
			  root          : 'records',
			  remoteSort    : false,
			  autoLoad      : false,
			  url           : '/netspoc/' + config.proxyurl,
			  listeners     : {
			      exception : this.onJsonException
			  }
		      });
	    NetspocWeb.store.Netspoc.superclass.constructor.call(this, config);
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
		Ext.MessageBox.show({ title   : 'Sitzung abgelaufen', 
				      msg     : 'Neu anmelden',
				      buttons : {ok:'OK', cancel:'Abbrechen'},
				      icon    : Ext.MessageBox.WARNING
				    });
		Ext.MessageBox.alert('Sitzung abgelaufen', 
				     'Neu anmelden',

				     // logout from workspace
				     NetspocManager.workspace.onAfterLogout);
	    }
	    else {
		Ext.MessageBox.show({ title   : 'Fehler', 
				      msg     : msg,
				      buttons : Ext.MessageBox.OK,
				      icon    : Ext.MessageBox.ERROR
				    });
	    }
	}
    }
);

Ext.reg( 'netspocstore', NetspocWeb.store.Netspoc);
