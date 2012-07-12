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
			  url           : 'backend/' + config.proxyurl
		      });
	    NetspocWeb.store.Netspoc.superclass.constructor.call(this, config);
	    this.addListener('beforeload', function ( store, options ) {
				 Ext.getBody().mask('Daten werden geladen ...', 
						    'x-mask-loading');
				 return true;			
			     });
	    this.addListener('load', function() { Ext.getBody().unmask(); });
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
		    if ( !msg ) {
			if ( arg ) {
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
			      NetspocManager.workspace.onAfterLogout();
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

Ext.reg( 'netspocstore', NetspocWeb.store.Netspoc);

NetspocWeb.store.NetspocState = Ext.extend(
    NetspocWeb.store.Netspoc,
    {
	constructor : function(config) {
	    var appstate = NetspocManager.appstate;
	    NetspocWeb.store.NetspocState.superclass.constructor.call(this, 
								      config);
	    // Set baseParams and reload store if appstate changes.
	    var networks_as_csv = this.getNetworksCSV( appstate.getNetworks() );
	    this.setBaseParam('active_owner', appstate.getOwner());
	    this.setBaseParam('history', appstate.getHistory());
	    this.setBaseParam('chosen_networks', networks_as_csv );
	    appstate.addListener(
		'changed', 
		function () {
		    var params;
		    var active_owner    = appstate.getOwner();
		    var history         = appstate.getHistory();
		    var chosen_networks = appstate.getNetworks();
		    var networks_as_csv = this.getNetworksCSV( chosen_networks );
		    this.setBaseParam('active_owner', active_owner);
		    this.setBaseParam('history', history);
		    this.setBaseParam('chosen_networks', networks_as_csv );

		    if (this.doReload) {

			// We need to add BaseParams again because
			// they had been copied to lastOptions internally.
			params = {
			    active_owner    : active_owner,
			    history         : history,
			    chosen_networks : networks_as_csv
			};
			Ext.applyIf( params, this.lastOptions.params );
			this.reload( { params : params } );
		    }
		}, this);
	},
	
	getNetworksCSV : function ( networks_as_csv ) {
	    var selected = [];
	    Ext.each( networks_as_csv, function (item) {
			  selected.push( item.data.name );
		      }
		    );
	    var networks = selected.join( ',');
	    //console.log( networks );
	    return networks;
	}
    }
);

Ext.reg( 'netspocstatestore', NetspocWeb.store.NetspocState);



// Stores with grouping for Grids using this feature.

NetspocWeb.store.NetspocGroup = Ext.extend(
    Ext.data.GroupingStore,
    {
	constructor : function(config) {
	    var url = 'backend/' + config.proxyurl;
	    config = Ext.apply(
		config,
		{
		    url    : url
		}
	    );
	    NetspocWeb.store.NetspocGroup.superclass.constructor.call(this, config);
	    this.addListener('beforeload', function ( store, options ) {
				 Ext.getBody().mask('Daten werden geladen ...', 
						    'x-mask-loading');
				 return true;			
			     });
	    this.addListener('load', function() { Ext.getBody().unmask(); });
	    this.addListener('exception', this.onJsonException);
	},
	onJsonException :
	function(proxy, type, action, options, response, arg ) {
	    Ext.getBody().unmask();
	    console.log( arg );
	    var msg;
	    
	    // status != 200
	    if (type == 'response') {
		try {
		    var jsonData = Ext.decode( response.responseText );
		    msg = jsonData.msg;
		    if ( !msg ) {
			if ( arg ) {
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
			      NetspocManager.workspace.onAfterLogout();
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

Ext.reg( 'netspocgroupstore', NetspocWeb.store.NetspocGroup);


NetspocWeb.store.NetspocGroupState = Ext.extend(
    NetspocWeb.store.NetspocGroup,
    {
	constructor : function(config) {
	    var appstate = NetspocManager.appstate;
	    NetspocWeb.store.NetspocGroupState.superclass.constructor.call(
		this, 
		config
	    );
	    // Set baseParams and reload store if appstate changes.
	    var networks_as_csv = this.getNetworksCSV( appstate.getNetworks() );
	    this.setBaseParam('active_owner', appstate.getOwner());
	    this.setBaseParam('history', appstate.getHistory());
	    this.setBaseParam('chosen_networks', networks_as_csv );
	    appstate.addListener(
		'changed', 
		function () {
		    var params;
		    var active_owner    = appstate.getOwner();
		    var history         = appstate.getHistory();
		    var chosen_networks = appstate.getNetworks();
		    var networks_as_csv =
			this.getNetworksCSV( chosen_networks );
		    this.setBaseParam('active_owner', active_owner);
		    this.setBaseParam('history', history);
		    this.setBaseParam('chosen_networks', networks_as_csv );

		    if (this.doReload) {

			// We need to add BaseParams again because
			// they had been copied to lastOptions internally.
			params = {
			    active_owner    : active_owner,
			    history         : history,
			    chosen_networks : networks_as_csv
			};
			Ext.applyIf( params, this.lastOptions.params );
			this.reload( { params : params } );
		    }
		}, this);
	},
	
	getNetworksCSV : function ( networks_as_csv ) {
	    var selected = [];
	    Ext.each( networks_as_csv, function (item) {
			  selected.push( item.data.name );
		      }
		    );
	    var networks = selected.join( ',');
	    //console.log( networks );
	    return networks;
	}
    }
);

Ext.reg( 'groupingstatestore', NetspocWeb.store.NetspocGroupState);



