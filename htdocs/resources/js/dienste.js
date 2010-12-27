

Ext.ns( "NetspocManager" );


NetspocManager.workspace = function () {
    var cardPanel, viewport, loginWindow, ownerWindow;

    return {
	
	init : function () {

	    // Automatic login:
	    Ext.Ajax.request(
		{
		    url          : '/netspoc/login',
		    params       : {
			user : 'rolf.niedziella@dataport.de'
		    },
		    scope        : this,
		    callback     : this.onAfterAjaxReq,
		    succCallback : this.onLoginSuccess
		}
	    );
/*
	    if ( ! loginWindow ) {
		loginWindow = this.buildLoginWindow();
	    }
	    loginWindow.show();
*/
        },

	buildLoginWindow : function() {
	    return new NetspocWeb.window.UserLoginWindow(
		{
		    scope   : this,
		    handler : this.onLogin
		}
	    );
	},

	onLogin :  function() {
	    var form = loginWindow.get(0);
	    if ( form.getForm().isValid() ) {
		loginWindow.el.mask('Bitte warten ...', 'x-mask-loading');
		
		form.getForm().submit(
		    {
			success : this.onLoginSuccess,
			failure : this.onLoginFailure,
			scope   : this
		    }
		);
	    }
	},

	onLoginSuccess : function( form, action ) {

// TEMP FOR TEST !!!!!
	    Ext.Ajax.request(
		{
		    url          : '/netspoc/set',
		    params       : {
			owner : 'DA_Netz_Firewall'
		    },
		    scope        : this,
		    callback     : this.onAfterAjaxReq,
		    succCallback : this.onSetOwnerSuccess
		}
	    );
// TEMP FOR TEST !!!!!
/*
  	    loginWindow.destroy();
	    loginWindow = null;
	    if ( ! ownerWindow ) {
		ownerWindow = this.buildOwnerWindow();
	    }
	    ownerWindow.show();
*/
	},

	onLoginFailure : function( form, action ) {
	    loginWindow.el.unmask();
	    var result = action.result;
	    var msg;
	    if ( result && result.msg != '' ) {
		msg = result.msg;
	    }
	    else {
		msg = 'Benutzername oder Passwort falsch.'
		+ ' Bitte versuchen Sie es erneut.';
	    }
	    Ext.Msg.show(
		{
		    title   : 'Login fehlgeschlagen!',
		    msg     : msg,
		    buttons : Ext.Msg.OK,
		    fn      : this.destroy_and_init(),
		    icon    : Ext.Msg.ERROR
		}
	    );
	},

	buildOwnerWindow : function() {
	    var remoteJsonStore = new Ext.data.JsonStore(
		{
		    totalProperty : 'totalCount',
		    root          : 'records',
		    baseParams    : {
			column : 'name'
		    },
		    fields     : [ 
			{
			    name    : 'name',
			    mapping : 'name'
			},
			{
			    name    : 'id',
			    mapping : 'id'
			}
		    ],
		    autoload : true,
		    proxy : new Ext.data.HttpProxy(
			{
			    url : '/netspoc/get_owner'
			}
		    )   
		}
	    );

	    var cbOwner = {
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
		store          : remoteJsonStore,
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
			    items : cbOwner
			}
		    ]
		}
	    );   
/*
	    return new NetspocWeb.window.ChooseOwnerWindow(
		{
		    scope   : this,
		    handler : this.onOwnerChosen
		}
	    );
*/
	},

	onOwnerChosen : function() {
	    var combo = Ext.getCmp( 'cbOwnerId' );
	    var url   = '/netspoc/set';
	    Ext.Ajax.request(
		{
		    url          : url,
		    params       : {
			owner : combo.getValue()
		    },
		    scope        : this,
		    callback     : this.onAfterAjaxReq,
		    succCallback : this.onSetOwnerSuccess
		}
	    );
	},

	onSetOwnerSuccess : function() {
	    if ( ownerWindow ) {
		ownerWindow.destroy();
		ownerWindow = null;
	    }
	    this.buildViewport();
	},

	onAfterAjaxReq : function( options, success, result ) {
	    Ext.getBody().unmask();
	    if ( success === true ) {
		var jsonData;
		try {
		    jsonData = Ext.decode( result.responseText );
		}
		catch (e) {
		    Ext.MessageBox.alert( 
			'Fehler!', 
			'Daten können nicht dekodiert werden (kein JSON?)!'
		    );
		}
		options.succCallback.call( options.scope, 
					   jsonData, options );
	    }
	    else {
		var m;
		if ( jsonData.msg ) {
		    m = jsonData.msg;
		    }
		else {
		    m = 'Unhandled exception?!';
		}
		Ext.MessageBox.alert( 'Fehler!', m );
	    }
	},

	onLogout : function() {
	    this.doLogout();
/*	    Ext.MessageBox.confirm(
		'Bitte bestätigen',
		'Möchten Sie sich wirklich ausloggen?',
		function(btn) {
		    if (btn === 'yes') {
			this.doLogout();
		    }
		},
		this
	    );
*/
	},
	
	doLogout : function() {
	    Ext.getBody().mask('Sie werden abgemeldet ...', 'x-mask-loading');
	    Ext.Ajax.request(
		{
		    url          : '/netspoc/logout',
		    scope        : this,
		    callback     : this.onAfterAjaxReq,
		    succCallback : this.onAfterLogout
		}
	    );
	},

	onAfterLogout : function(jsonData) {
	    this.destroy_and_init();
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

	destroy_and_init : function() {
	    this.destroy();
	    this.init();
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
	    Ext.getBody().unmask();
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

	