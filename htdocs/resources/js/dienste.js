
/**
 * Copyright (c)2005-2009 Matt Kruse (javascripttoolbox.com)
 * 
 * Dual licensed under the MIT and GPL licenses. 
 * This basically means you can use this code however you want for
 * free, but don't claim to have written it yourself!
 * Donations always accepted: http://www.JavascriptToolbox.com/donate/
 * 
 * Please do not link to the .js files on javascripttoolbox.com from
 * your site. Copy the files locally to your server instead.
 * 
 */
var Dumper = (function(){
	// "Private"
	var maxIterations = 1000;
	var maxDepth = -1; // Max depth that Dumper will traverse in object
	var iterations = 0;
	var indent = 1;
	var indentText = " ";
	var newline = "\n";
	var object = null; // Keeps track of the root object passed in
	var properties = null; // Holds properties of top-level object to traverse - others are ignored

	function args(a,index) {
		var myargs = new Array();
		for (var i=index; i<a.length; i++) {
			myargs[myargs.length] = a[i];
		}
		return myargs;
	};

	function pad(len) {
		var ret = "";
		for (var i=0; i<len; i++) {
			ret += indentText;
		}
		return ret;
	};

	function string(o) {
		var level = 1;
		var indentLevel = indent;
		var ret = "";
		if (arguments.length>1 && typeof(arguments[1])=="number") {
			level = arguments[1];
			indentLevel = arguments[2];
			if (o == object) {
				return "[original object]";
			}
		}
		else {
			iterations = 0;
			object = o;
			// If a list of properties are passed in
			if (arguments.length>1) {
				var list = arguments;
				var listIndex = 1;
				if (typeof(arguments[1])=="object") {
					list = arguments[1];
					listIndex = 0;
				}
				for (var i=listIndex; i<list.length; i++) {
					if (properties == null) { properties = new Object(); }
					properties[list[i]]=1;
				}
			}
		}
		if (iterations++>maxIterations) { return "[Max Iterations Reached]"; } // Just in case, so the script doesn't hang
		if (maxDepth != -1 && level > (maxDepth+1)) {
			return "...";
		}
		// undefined
		if (typeof(o)=="undefined") {
			return "[undefined]";
		}
		// NULL
		if (o==null) {
			return "[null]";
		}
		// DOM Object
		if (o==window) {
			return "[window]";
		}
		if (o==window.document) {
			return "[document]";
		}
		// FUNCTION
		if (typeof(o)=="function") {
			return "[function]";
		} 
		// BOOLEAN
		if (typeof(o)=="boolean") {
			return (o)?"true":"false";
		} 
		// STRING
		if (typeof(o)=="string") {
			return "'" + o + "'";
		} 
		// NUMBER	
		if (typeof(o)=="number") {
			return o;
		}
		if (typeof(o)=="object") {
			if (typeof(o.length)=="number" ) {
				// ARRAY
				if (maxDepth != -1 && level > maxDepth) {
					return "[ ... ]";
				}
				ret = "[";
				for (var i=0; i<o.length;i++) {
					if (i>0) {
						ret += "," + newline + pad(indentLevel);
					}
					else {
						ret += newline + pad(indentLevel);
					}
					ret += string(o[i],level+1,indentLevel-0+indent);
				}
				if (i > 0) {
					ret += newline + pad(indentLevel-indent);
				}
				ret += "]";
				return ret;
			}
			else {
				// OBJECT
				if (maxDepth != -1 && level > maxDepth) {
					return "{ ... }";
				}
				ret = "{";
				var count = 0;
				for (i in o) {
					if (o==object && properties!=null && properties[i]!=1) {
						// do nothing with this node
					}
					else {
						if (typeof(o[i]) != "unknown") {
							var processAttribute = true;
							// Check if this is a DOM object, and if so, if we have to limit properties to look at
							if (o.ownerDocument|| o.tagName || (o.nodeType && o.nodeName)) {
								processAttribute = false;
								if (i=="tagName" || i=="nodeName" || i=="nodeType" || i=="id" || i=="className") {
									processAttribute = true;
								}
							}
							if (processAttribute) {
								if (count++>0) {
									ret += "," + newline + pad(indentLevel);
								}
								else {
									ret += newline + pad(indentLevel);
								}
								ret += "'" + i + "' => " + string(o[i],level+1,indentLevel-0+i.length+6+indent);
							}
						}
					}
				}
				if (count > 0) {
					ret += newline + pad(indentLevel-indent);
				}
				ret += "}";
				return ret;
			}
		}
	};

	string.popup = function(o) {
		var w = window.open("about:blank");
		w.document.open();
		w.document.writeln("<HTML><BODY><PRE>");
		w.document.writeln(string(o,args(arguments,1)));
		w.document.writeln("</PRE></BODY></HTML>");
		w.document.close();
	};

	string.alert = function(o) {
		alert(string(o,args(arguments,1)));
	};

	string.write = function(o) {
		var argumentsIndex = 1;
		var d = document;
		if (arguments.length>1 && arguments[1]==window.document) {
			d = arguments[1];
			argumentsIndex = 2;
		}
		var temp = indentText;
		indentText = "&nbsp;";
		d.write(string(o,args(arguments,argumentsIndex)));
		indentText = temp;
	};
	
	string.setMaxIterations = function(i) {
		maxIterations = i;
	};
	
	string.setMaxDepth = function(i) {
		maxDepth = i;
	};

	string.$VERSION = 1.0;
	
	return string;
})();



/* DUMPER END **********************************************************/


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

	