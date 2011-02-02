Ext.ns('NetspocWeb.store');

NetspocWeb.store.Netspoc = Ext.extend(
    Ext.data.JsonStore,
    {
	constructor : function(config) {
	    Ext.apply(config,
		      {
    			  totalProperty : 'totalCount',
			  successProperty : 'success',
			  root          : 'records',
			  remoteSort    : false,
			  url           : '/netspoc/' + config.proxyurl
		      });
	    NetspocWeb.store.Netspoc.superclass.constructor.call(this, config);
	    this.on('exception', this.onJsonException, this, { scope : this });
	},

	onJsonException :
	function(proxy, type, action, options, response, arg ) {
	    var msg;
	    // Use other class, because method onAfterLogout of that class is 
	    // called by showJsonError
	    if (type == 'response') {
		NetspocManager.workspace.onAfterAjaxReq(this, true, response);
	    }
	    else {
		NetspocManager.workspace.showJsonError(response.msg);
	    }
	    
	}
    }
);

Ext.reg( 'netspocstore', NetspocWeb.store.Netspoc);
