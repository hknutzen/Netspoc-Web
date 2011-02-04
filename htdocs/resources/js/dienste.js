

Ext.ns( "NetspocManager" );


NetspocManager.workspace = function () {
    var cardPanel, viewport, loginWindow, ownerWindow;

    return {
	
	init : function () {
	    this.get_owner();
	},
	 
	get_owner : function() {
	    if ( ! ownerWindow ) {
		ownerWindow = this.buildOwnerWindow();
	    }
	    ownerWindow.show();
	},

	buildOwnerWindow : function() {
	    var store = {
		xtype      : 'netspocstore',
		proxyurl   : 'get_owner',
		baseParams : { column : 'name' },
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

	    var combo = {
		xtype          : 'combo',
		id             : 'cbOwnerId',
		fieldLabel     : 'Verantwortungsbereich',
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
		listeners:{
		    scope    : this,
		    'select' : this.onOwnerChosen
		}
		
	    };	    

	    return new Ext.Window(
		{
		    id       : 'myWindow', 
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
	    ); 
	},

	onOwnerChosen : function() {
	    var combo = Ext.getCmp( 'cbOwnerId' );
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'set',
		    fields   : []
		}
	    );
	    store.load({ params   : { owner : combo.getValue() },
			 callback : this.onSetOwnerSuccess,
			 scope    : this
		       });
	},

	onSetOwnerSuccess : function() {
	    if ( ownerWindow ) {
		ownerWindow.destroy();
		ownerWindow = null;
	    }
	    this.buildViewport();
	},

	onLogout : function() {
	    this.doLogout();
	},
	
	doLogout : function() {
	    var store =  new NetspocWeb.store.Netspoc(
		{
		    proxyurl : 'logout',
		    fields   : []
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
	    if ( loginWindow ) {
		loginWindow.destroy();
		loginWindow = null;
	    }
	    if ( ownerWindow ) {
		ownerWindow.destroy();
		ownerWindow = null;
	    }
	},

	buildViewport : function () {


	    /****************************************************************/
	    // Define viewport as BorderLayout.
	    /****************************************************************/

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
			{
			    text    : 'Verantwortungsbereich',
			    iconCls : 'icon-user',
			    scope   : this,
			    handler : function() {
				this.destroy();
				ownerWindow = this.buildOwnerWindow();
				ownerWindow.show();
			    }
			}
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

	