

Ext.ns( "NetspocManager" );


NetspocManager.workspace = function () {
    var cardPanel, viewport, owner;

    return {
	
	init : function () {
	    this.get_active_owner();
	},
	 
	get_active_owner : function() {
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'get_owner',
		    storeId  : 'active_owner',
		    autoDestroy: true,
		    fields     : [ 
			{
			    name    : 'name',
			    mapping : 'name'
			}
		    ]
		}
	    );
	    store.load({ callback : this.onOwnerLoaded,
			 scope    : this,
			 store    : store
		       });
	},

	onOwnerLoaded : function(records, options, success) {

	    if (! success) {
		return;
	    }
	    // Keep already selected owner.
	    if (records.length > 0) {
		var new_owner = records[0].get('name');
		this.setOwner(new_owner);
	    }
	    // Owner was never selected, ask user.
	    else {
		var combo = this.buildOwnerCombo();
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
	    options.store.destroy();
	},

	buildOwnersStore : function() {
	    return {
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
	},
	buildOwnerCombo : function() {
	    var store = this.buildOwnersStore();
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

		// show active owner
		value          : owner,
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
	    if (owner == new_owner) {
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
	    owner = options.params.owner;

	    // close window late, otherwise we get some extjs error.
	    var window = Ext.getCmp( 'ownerWindow' );
	    if (window) {
		window.close();
	    }
	    this.destroy();
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
	    history.back()
	},

	destroy : function() {
	    if ( viewport ) {
		viewport.destroy();
		viewport = null;
	    }
	},

	buildViewport : function () {
	    cardPanel = new Ext.Panel(
		{
		    layout     : 'card',
		    activeItem : 0,
		    border     : false,
		    defaults   :  { workspace : this },
		    items      :  [
			{ xtype  : 'policymanager'  },
			{ xtype  : 'networkmanager' }
		    ],
		    tbar   : [
			{
			    text          : 'Dienste anzeigen',
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
			    iconCls      : 'icon-shape_shade_c',
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
			this.buildOwnerCombo(),
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

	