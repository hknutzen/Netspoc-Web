

Ext.ns( "NetspocManager" );

Ext.QuickTips.init();

// This is a workaround for a bug that was supposed to be fixed
// long ago in ExtJs 3.1.1, but it has not been fixed, as it seems.
// Without this workaround we get an error message on closing
// the window that displays current services of policylist.
// Error: this.config[i].destroy is not a function
// Forum post: http://www.sencha.com/forum/showthread.php?91686-FIXED-547-3.1.1-ColumnModel-setConfig%28%29-gt-this.config-i-.destroy-not-a-function

Ext.override(Ext.grid.ColumnModel, {
    // private
    destroyConfig: function() {
        for (var i = 0, len = this.config.length; i < len; i++) {
            Ext.destroy(this.config[i]);
        }
    },

    destroy : function() {
        this.destroyConfig();
        this.purgeListeners();
    },
    
    setConfig: function(config, initial) {
        var i, c, len;
        if (!initial) { // cleanup
            delete this.totalWidth;
            this.destroyConfig();
        }

        // backward compatibility
        this.defaults = Ext.apply({
            width: this.defaultWidth,
            sortable: this.defaultSortable
        }, this.defaults);

        this.config = config;
        this.lookup = {};

        for (i = 0, len = config.length; i < len; i++) {
            c = Ext.applyIf(config[i], this.defaults);
            // if no id, create one using column's ordinal position
            if (Ext.isEmpty(c.id)) {
                c.id = i;
            }
            if (!c.isColumn) {
                var Cls = Ext.grid.Column.types[c.xtype || 'gridcolumn'];
                c = new Cls(c);
                config[i] = c;
            }
            this.lookup[c.id] = c;
        }
        if (!initial) {
            this.fireEvent('configchange', this);
        }
    }
});


// Store state of currently selected owner and history.
// - owner is a string
// - history is an object { policy : .., date : .., time : .., current : ..}
// This is used by netspocstatestore to set and update its baseParams.
NetspocManager.appstate = function () {
    var owner, owner_alias, history, networks;
    var state = new Ext.util.Observable();
    state.addEvents('changed', 'ownerChanged', 'networksChanged');
    state.changeOwner = function (name, alias, silent) {
        owner_alias = alias;
	if (name !== owner) {
	    owner = name;
            if (! silent) {
	        state.fireEvent('changed');
	        state.fireEvent('ownerChanged');
            }
	}
    };
    state.changeHistory = function (record, silent) {
	var data = { policy  : record.get('policy'),
		     date    : record.get('date'),
		     time    : record.get('time'),
		     current : record.get('current') };
	if (! history || 
	    data.policy !== history.policy) 
	{
	    history = data;
            if (! silent) {
                state.fireEvent('changed');
            }
	}
    };
    state.changeNetworks = function ( chosen_networks, silent) {
	if ( chosen_networks !== networks ) {
	    networks = chosen_networks;
            if ( ! silent ) {
	        state.fireEvent('changed');
	        state.fireEvent('networksChanged');
            }
	}
    };
    state.getOwner = function () {
	return owner;
    };
    state.getOwnerAlias = function () {
	return owner_alias;
    };
    state.getPolicy = function () {
        return history.policy;
    };
    state.getHistory = function () {
	if (history.current) {
	    return history.policy;
	}
	else {
	    return history.date;
	}
    };
    state.getNetworks = function () {
        return networks;
    };
    state.showHistory = function () {
	var now = new Date();
	
	// history.date: 'yyyy-mm-dd'
	var ymd = history.date.split('-');

	// month for 'new Date' is counted from 0.
	var pdate = new Date(ymd[0], ymd[1]-1, ymd[2]);
	var when = (now.getDayOfYear() === pdate.getDayOfYear())
	? history.time : history.date;
	var version = history.current ? 'aktuell' : history.policy; 
	return (when + ' (' + version + ')');
    };
    return state;
}();

NetspocManager.workspace = function () {
    var viewport;
    return {
	
	init : function () {
	    this.getActiveOwner();
	},
	getActiveOwner : function() {
	    var store = new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'get_owner',
		    autoDestroy: true,
		    fields     : [ 'name',
                                   { name : 'alias',

                                     // Take name, if no alias available.
                                     mapping : function(node) {
                                         return node.alias || node.name;
                                     },
                                     sortType : 'asUCString' 
                                   } 
                                 ]
		}
	    );
	    store.load({ scope    : this,
			 store    : store,
			 callback : function(records, options, success) {

			     // Keep already selected owner.
			     if (success && records.length) {
				 var owner = records[0].get('name');
				 var alias = records[0].get('alias');
				 this.setOwnerState({ name : owner, 
                                                      alias : alias });
			     }
			     // Owner was never selected, 
			     // check number of available owners.
			     else {
				 var store = 
                                     Ext.create(
                                         this.buildOwnersStore( 
                                             { autoLoad : true }
                                         )
                                     );
				 store.load({ callback : this.onOwnerLoaded,
					      scope    : this,
					      store    : store
					    });
			     }
			     options.store.destroy();
			 }});
	},

	onOwnerLoaded : function(records, options, success) {

	    if (! success) {
		return;
	    }
	    // Automatically select owner if only one is available.
	    if (records.length === 1) {
		var owner = records[0].get('name');
		var alias = records[0].get('alias');
		this.setOwner(owner, alias);
	    }
	    // Ask user to select one owner.
	    else {
		var combo = this.buildOwnerCombo(options.store);
		new Ext.Window(
 		    {
			id       : 'ownerWindow',
 			title    : 'Verantwortungsbereich ausw&auml;hlen',
 			width    : 400, 
 			height   : 80,
 			layout   : 'fit', 
 			items    : [
 			    {
 				xtype  : 'panel',
 				frame  : true,
 				layout : {
 				    type    : 'fit',
 				    padding : '5',
 				    align   : 'center'
 				},
 				items : combo
 			    }
 			]
 		    }
 		).show();
	    }
	},
	buildOwnersStore : function(options) {
	    var config =
		{
		    xtype      : 'netspocstore',
                    autoLoad   : true,
		    proxyurl   : 'get_owners',
		    autoDestroy: true,
		    sortInfo   : { field: 'alias', direction: 'ASC' },
		    fields     : [ { name : 'name' },
                                   { name : 'alias',
                                     mapping : function(node) {
                                         return node.alias || node.name;
                                     },
                                     sortType : 'asUCString' 
                                   }
                                 ]
		};
            if (options) {
                config = Ext.apply(config, options);
            }
	    return config;
	},
	buildOwnerCombo : function(store) {
	    var config = {
		xtype          : 'combo',
		id             : 'cbOwnerId',
		forceSelection : true, 
		autoselect     : true,
		editable       : true,
		allowblank     : false,
                selectOnFocus  : true,
                typeAhead      : true,
                minChars       : 1,
		displayField   : 'alias',
		valueField     : 'name',
		loadingText    : 'Abfrage l&auml;uft ...',
		mode           : 'local',
		store          : store,
		triggerAction  : 'all',
		listWidth      : 400,

		// Show active owner.
		value          : NetspocManager.appstate.getOwnerAlias(),
		listeners:{
		    scope    : this,
		    'select' : this.onOwnerChosen
		}
		
	    };
	    return config;
	},
	onOwnerChosen : function() {
	    var combo = Ext.getCmp( 'cbOwnerId' );
	    var owner = combo.getValue();
            var store, alias;
	    if (NetspocManager.appstate.getOwner() === owner) {
		return;
	    }

            // Get alias name as well
            store = combo.store;
            alias = 
                store.getAt(store.findExact('name', owner)).get('alias');
	    this.setOwner(owner, alias);
	},
	setOwner : function(owner, alias) {
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'set',
		    fields   : [],
		    autoDestroy : true
		}
	    );
	    store.load({ params   : { owner : owner },
			 callback : this.onSetOwnerSuccess,
			 scope    : this,

                         // private option
                         owner    : {  name : owner, alias : alias }
		       });
	},
	onSetOwnerSuccess : function(records, options, success) {
	    var owner_obj = options.owner;
	    var window = Ext.getCmp( 'ownerWindow' );

	    // Close window late, otherwise we get some extjs error.
	    if (window) {
		window.close();
	    }
	    this.setOwnerState(owner_obj);
	},
	setOwnerState : function(owner_obj) {
            // Call appstate.changeOwner later, after history has been set.
	    this.getCurrentPolicy(owner_obj);            
	},
	getCurrentPolicy : function(owner_obj) {
	    var store = new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'get_policy',
		    autoDestroy: true,
		    fields     : [ 'policy', 'date', 'time', 'current' ]
		}
	    );
	    store.load({ scope    : this,
                         // Make store and owner available for callback.
			 store    : store, 
                         owner    : owner_obj,
			 callback : this.onPolicyLoaded
		       });
	},
	onPolicyLoaded : function(records, options, success) {
            var owner_ob = options.owner;
	    var record;
	    if (success && records.length) {
		record = records[0];
                // Don't fire change event.
		NetspocManager.appstate.changeHistory(record, true);
	    }
	    NetspocManager.appstate.changeOwner(owner_ob.name, owner_ob.alias);
	    options.store.destroy();
	    this.buildViewport();
	},


	onLogout : function() {
	    this.doLogout();
	},
	
	doLogout : function() {
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'logout',
		    fields   : [],
		    autoDestroy : true
		}
	    );
	    store.load({ params   : {},
			 callback : this.onAfterLogout,
			 scope    : this
		       });
	},

	onAfterLogout : function() {

	    // Jump to login page,
	    // which is assumed to be the default page in current directory.
	    window.location.href = '.';
	},

	buildViewport : function () {
            if (viewport) {
                return;
            }
            // Must be instantiated early, because this store is used
            // - in toolbar of cardpaned and
            // - in toolbar of diffmanager.
            var historyStore = Ext.create( 
                {
		    xtype      : 'netspocstatestore',
	            storeId    : 'historyStore',
		    proxyurl   : 'get_history',
		    autoDestroy: true,
		    fields     : [ 'policy', 'date', 'time', 'current' ],
                    // Own option, used in combo box of diffmanager.
                    needLoad   : true
	        }
            );
	    var cardPanel = {
                xtype          : 'panel',
		layout         : 'card',
		activeItem     : 0,
                layoutConfig   : { deferredRender : false },
		border         : false,

                // Add this workspace as attribute to every child.
                // So we can access workspace methods from childs.
	        defaults       :  { workspace : this },
		items          :  [

                    // Index of items must be the same as
                    // index of buttons in toolbar below.
		    { xtype : 'policymanager'  },
		    { xtype : 'networkmanager' },
		    { xtype : 'diffmanager'    },
                    { xtype : 'accountmanager' }
		    ],
		tbar   : [
		    {
			text         : 'Dienste, Freischaltungen',
			iconCls      : 'icon-chart_curve',
			toggleGroup  : 'navGrp',
			enableToggle : true,
			pressed      : true,
			scope        : this,
			handler      : this.switchToCard
		    },
		    {
			text         : 'Eigene Netze',
			iconCls      : 'icon-computer_connect',
			toggleGroup  : 'navGrp',
			enableToggle : true,
			scope        : this,
			handler      : this.switchToCard
		    },
		    {
			text         : 'Diff',
			iconCls      : 'icon-chart_curve_edit',
			toggleGroup  : 'navGrp',
			enableToggle : true,
			scope        : this,
			handler      : this.switchToCard
		    },
		    {
			text         : 'Berechtigungen',
			iconCls      : 'icon-group',
			toggleGroup  : 'navGrp',
			enableToggle : true,
			scope        : this,
			handler      : this.switchToCard
		    },
		    '->',
		    'Stand',
		    this.buildHistoryCombo(historyStore),
                    ' ',
		    'Verantwortungsbereich',
		    this.buildOwnerCombo(this.buildOwnersStore()),
                    ' ',
		    'Abmelden',
		    {
			iconCls : 'icon-door_out',
			scope   : this,
			handler : this.onLogout
		    }
		]
	    };
	    
	    viewport = new Ext.Viewport(
		{
		    id     : 'viewportId',
		    layout : 'fit',
		    items  : cardPanel
		}
	    );
	},  // end of buildViewport

	switchToCard : function( button ) {
            var index = button.ownerCt.items.indexOf(button);
	    var cardPanel = button.findParentByType('panel');
	    cardPanel.layout.setActiveItem( index );
	},

	buildHistoryCombo : function (store) {
	    var appstate = NetspocManager.appstate;
	    var combo = Ext.create(
                {
		    xtype          : 'historycombo',
                    store          : store,

		    // Show initially selected history (i.e curent version).
		    value          : appstate.showHistory(),
		    listeners: {
		        scope  : this,
		        // Delete the previous query in the beforequery event.
		        // This will reload the store the next time it expands.
		        beforequery: function(qe){
                            var combo = qe.combo;
			    delete combo.lastQuery;
                            combo.getStore().needLoad = false;
		        },
		        select : function (combo, record, index) {
			    appstate.changeHistory(record);
			    combo.setValue(appstate.showHistory());
		        }
		    }
	        });
	    appstate.addListener(
		'ownerChanged', 
		function () {
                    var store = this.getStore();
                    this.setValue(appstate.showHistory()); 
                    store.needLoad = true; 
                }, 
                combo);
            return combo;
	}

    }; // end of return-closure
}(); // end of NetspocWeb.workspace function

	    
Ext.onReady( NetspocManager.workspace.init, NetspocManager.workspace );
