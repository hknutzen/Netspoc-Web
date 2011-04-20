

Ext.ns( "NetspocManager" );

Ext.QuickTips.init();

// Store state of currently selected owner and history.
// This is used by netspocstatestore to set and update its baseParams.
NetspocManager.appstate = function () {
    var selectedOwner, selectedHistory;
    var state = new Ext.util.Observable();
    state.addEvents('changed');
    state.changeOwner = function (newOwner) {
	if (newOwner !== selectedOwner) {
	    selectedOwner = newOwner;
	    state.fireEvent('changed');
	}
    };
    state.changeHistory = function (newHistory) {
	if (newHistory !== selectedHistory) {
	    selectedHistory = newHistory;
	    state.fireEvent('changed');
	}
    };
    state.getOwner = function () {
	return selectedOwner;
    };
    state.getHistory = function () {
	return selectedHistory;
    };
    return state;
}();

NetspocManager.workspace = function () {
    var cardPanel, viewport;
    return {
	
	init : function () {
	    this.getCurrentPolicy();
	    this.get_active_owner();
	},
	getCurrentPolicy : function() {
	    var store = new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'get_policy',
		    autoDestroy: true,
		    fields     : [ 'policy', 'date', 'time' ]
		}
	    );
	    store.load({ scope    : this,
			 store    : store, // make store available for callback
			 callback : function(records, options, success) {
			     var policy;
			     if (success && records.length) {
				 policy = records[0].get('policy');
				 NetspocManager.appstate.changeHistory(policy);
			     }
			     options.store.destroy();
			 }
		       });
	},
	get_active_owner : function() {
	    var store = new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'get_owner',
		    autoDestroy: true,
		    fields     : [ 'name' ]
		}
	    );
	    store.load({ scope    : this,
			 store    : store,
			 callback : function(records, options, success) {

			     // Keep already selected owner.
			     if (success && records.length) {
				 var new_owner = records[0].get('name');
				 this.setOwner(new_owner);
			     }
			     // Owner was never selected, 
			     // check number of available owners.
			     else {
				 var store = Ext.create(this.buildOwnersStore());
				 store.load({ callback : this.onAllOwnerLoaded,
					      scope    : this,
					      store    : store
					    });
			     }
			     options.store.destroy()
			 }});
	},

	onAllOwnerLoaded : function(records, options, success) {

	    if (! success) {
		return;
	    }
	    // Automatically select owner if only one is available.
	    if (records.length === 1) {
		var new_owner = records[0].get('name');
		this.setOwner(new_owner);
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

	buildOwnersStore : function() {
	    var config =
		{
		    xtype      : 'netspocstore',
		    proxyurl   : 'get_owners',
		    baseParams : { column : 'name' },
		    autoDestroy: true,
		    fields     : [ 
			{
			    name    : 'name',
			    mapping : 'name'
			},
			{
			    name    : 'id',
			    mapping : 'id'
			}
		    ]
		};
	    return config;
	},
	buildOwnerCombo : function(store) {
	    var config = {
		xtype          : 'combo',
		id             : 'cbOwnerId',
		forceSelection : true, 
		autoselect     : true,
		editable       : false,
		allowblank     : false,
		displayField   : 'name',
		valueField     : 'name',
		loadingText    : 'Abfrage l&auml;uft ...',
		mode           : 'remote',
		triggerAction  : 'all',
		store          : store,
		listWidth      : 400,

		// Show active owner.
		value          : NetspocManager.appstate.getOwner(),
		listeners:{
		    scope    : this,
		    'select' : this.onOwnerChosen
		}
		
	    };
	    return config;
	},

	onOwnerChosen : function() {
	    var combo = Ext.getCmp( 'cbOwnerId' );
	    var new_owner = combo.getValue();
	    if (NetspocManager.appstate.getOwner() === new_owner) {
		return;
	    }
	    this.setOwner(new_owner);
	},

	setOwner : function(new_owner) {
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'set',
		    fields   : [],
		    autoDestroy : true
		}
	    );
	    store.load({ params   : { owner : new_owner },
			 callback : this.onSetOwnerSuccess,
			 scope    : this
		       });
	},

	onSetOwnerSuccess : function(records, options, success) {
	    NetspocManager.appstate.changeOwner(options.params.owner);

	    // close window late, otherwise we get some extjs error.
	    var window = Ext.getCmp( 'ownerWindow' );
	    if (window) {
		window.close();
	    }
	    if (! viewport) {
		this.buildViewport();
	    }
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
	    cardPanel = new Ext.Panel(
		{
		    layout     : 'card',
		    activeItem : 0,
		    border     : false,
		    defaults   :  { workspace : this },
		    items      :  [
			{ xtype : 'policymanager'  },
			{ xtype : 'networkmanager' }
		    ],
		    tbar   : [
			{
			    text          : 'Dienste, Freischaltungen',
			    iconCls       : 'icon-chart_curve',
			    toggleGroup   : 'navGrp',
			    itemType      : 'policymanager',
			    enableToggle  : true,
			    pressed       : true,
			    scope         : this,
			    handler       : this.onSwitchPanel
			},
			'-',
			{
			    text         : 'Eigene Netze',
			    iconCls      : 'icon-computer_connect',
			    itemType     : 'networkmanager',
			    toggleGroup  : 'navGrp',
			    enableToggle : true,
			    scope        : this,
			    handler      : this.onSwitchPanel
			},
			'->',
			{
			    text    : 'Abmelden',
			    iconCls : 'icon-door_out',
			    scope   : this,
			    handler : this.onLogout
			},
			'->',
			this.buildOwnerCombo(this.buildOwnersStore()),
			'->',
			'Verantwortungsbereich'
		    ]
		}
	    );
	    
	    viewport = new Ext.Viewport(
		{
		    layout : 'fit',
		    items  : cardPanel
		}
	    );
	},  // end of buildViewport

	onSwitchPanel : function( button ) {
	    var xtype = button.itemType,
            panels    = cardPanel.findByType(xtype),
            newPanel  = panels[0];
	    
	    var newCardIndex = cardPanel.items.indexOf( newPanel ); 
	    this.switchToCard( newCardIndex, newPanel );
	},

	switchToCard : function( newCardIndex, newPanel ) {
	    var layout     = cardPanel.getLayout(),
            activePanel    = layout.activeItem,
            activePanelIdx = cardPanel.items.indexOf( activePanel );
	    
	    if ( activePanelIdx !== newCardIndex ) {
		layout.setActiveItem( newCardIndex ); 
		
		if ( newPanel.cleanSlate ) {
		    newPanel.cleanSlate();
		}
	    }
	}

    }; // end of return-closure
}(); // end of NetspocWeb.workspace function

	    
Ext.onReady( NetspocManager.workspace.init, NetspocManager.workspace );

	