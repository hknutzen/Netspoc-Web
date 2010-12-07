
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



/*******************************************************************/


// FOO
function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : 'http://10.3.28.111/netspoc/' + path
	}
    );
}


Ext.ns( "NetspocWeb" );

NetspocWeb.workspace = function () {
    var viewport, loginWindow, ownerWindow;

    return {
	
	init : function () {
	    // Automatic login:
	    Ext.Ajax.request(
		{
		    url          : 'http://10.3.28.111/netspoc/login',
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
	    //loginWindow.el.unmask();
	    if ( ! ownerWindow ) {
		ownerWindow = this.buildOwnerWindow();
	    }
	    ownerWindow.show();
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
			    url : 'http://10.3.28.111/netspoc/get_owner'
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
	    var url   = 'http://10.3.28.111/netspoc/set';
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
		    url          : 'http://10.3.28.111/netspoc/logout',
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

	    // Define proxies for all needed requests.
	    var all_services_proxy = proxy4path( 'service_list' );
	    var get_owner_proxy    = proxy4path( 'get_owner'    );
	    
	    /****************************************************************/
	    /* Define Listview containing services user clicks on
	     * in order to display service details in a neighboring Dataview.
	     */
	    /****************************************************************/

	    var policyLvStore = {
		xtype         : 'jsonstore',
		totalProperty : 'totalCount',
		root          : 'records',
		autoLoad      : true,
		remoteSort    : false,
		sortInfo      : { field: 'name', direction: "ASC" },
		storeId       : 'policyDvStoreId',
		proxy         : all_services_proxy,
		fields        : [
		    { name : 'name',  mapping : 'name'         },
		    { name : 'desc',  mapping : 'description'  },
		    { name : 'ping',  mapping : 'pingallowed' },
		    { name : 'owner', mapping : 'owner'        }
		],
		listeners : {
		    load : function( thisStore, records, options ) {
			var lvPolicies =
			    Ext.getCmp('lvPolicyId');
			// Select first policy after store has loaded.
			lvPolicies.select( 0 );
		    }
		}
	    };

	    var lvPolicy = new Ext.ListView(
		{
		    id            : 'lvPolicyId',
		    store         : policyLvStore,
		    singleSelect  : true,
//		    style         : 'background-color: #A0A0A0;',
		    autoscroll    : true,
		    columns       : [
			{
			    header    : 'Dienstname',
			    dataIndex : 'name'
			}
		    ],
		    listeners : {
			click : function( thisView, index ) {
			    var record = thisView.store.getAt( index );
			    if ( record ) {
				// Name of selected policy.
				var policy = record.get( 'name' );

				// Set URLs of proxy-attribute of the
				// stores loading rules and user-details.
				var stUserDetails =
				    Ext.StoreMgr.get('stUserLvId');
				var dvRules =
				    Ext.StoreMgr.get('dvRulesStoreId');
				var url = 'get_rules?service=' + policy;
				var rulesProxy = proxy4path( url );
				dvRules.proxy = rulesProxy;
				url = 'get_user?service=' + policy;
				stUserDetails.proxy = proxy4path( url );

				// Set values of rules-DataView to values
				// of selected policy (stored in record).
				var desc   = record.get( 'desc' );
				var owner  = record.get( 'owner' );
				var ping   = record.get( 'ping' );
				var arrayData = [
				    [ policy, desc, ping, owner ]
				];
				var nameRecord = Ext.data.Record.create(
				    [
					{  name : 'name',  mapping : 0  },
					{  name : 'desc',  mapping : 1  },
					{  name : 'ping',  mapping : 2  },
					{  name : 'owner', mapping : 3  }
				    ]
				);
				var arrayReader = new Ext.data.ArrayReader(
				    {}, nameRecord );
				var memoryProxy  = new Ext.data.MemoryProxy(
				    arrayData );
				var store = new Ext.data.Store(
				    {
					reader : arrayReader,
					proxy  : memoryProxy
				    }
				);

				// Load stores of both policy-detail-dataviews.
				dvDetails.bindStore( store );
				dvDetails.getStore().reload();
				dvRules.load();
				
				// Load store showing user-details.
				stUserDetails.load();
			    }
			}
/*
			selectionchange : function( thisView, selectedNodes ) {
			    // Single select is on, so we have only one node.
			    // TODO: make initial (automatic) selection
			    // after store load display details in DataView.
			    var node = selectedNodes[0];
			}
*/
		    }
		}
	    );

	    /****************************************************************/
	    // Define Dataview to display rules of selected service.
	    /****************************************************************/
	    
	    var dvRulesTpl = new Ext.XTemplate(
		'<div class="rule-container">',  // div for one rule
		'<table>',

		'<tpl for=".">',   // rules-loop
		'<tr>',    // new row
		'<td class="action"> {action} </td> ',
		'<tpl if="has_user==src">',		    
		'<td class="user"> User  </td>',
		'<td class="dst" > {dst} </td>',
		'</tpl>',  // end tpl-if
		'<tpl if="has_user==dst">',		    
		'<td class="src" > {src} </td>',
		'<td class="user"> User  </td>',
		'</tpl>',  // end tpl-if
		'<td class="srv"> {srv}  </td>',
		'</tr>',    // end row
		'</tpl>',  // end rules-loop

		'</table>',
		'</div>'
	    );
    
	    var dvRulesStore = {
		xtype    : 'jsonstore',
		root     : 'records',
		autoLoad : false,
		storeId  : 'dvRulesStoreId',
		fields   : [
		    { name : 'has_user', mapping : 'hasuser' },
		    { name : 'action',   mapping : 'action'  },
		    { name : 'src',      mapping : function( node ) {
			  return node.src.join( '<br>' );
		      }
		    },
		    { name : 'dst',      mapping : function( node ) {
			  return node.dst.join( '<br>' );
		      }
		    },
		    { name : 'srv',      mapping : function( node ) {
			  return node.srv.join( '<br>' );
		      }
		    }
		]
	    };

	    var dvRules = new Ext.DataView(
		{
		    tpl   : dvRulesTpl,
		    store : dvRulesStore
		}
	    ); 


	    /****************************************************************/
	    // Define Dataview to display details of selected service.
	    /****************************************************************/
	    
	    var dvDetailsTpl = new Ext.XTemplate(
		'<tpl for=".">',

		'<div class="policy"> {name} </div>',
		'<div class="policy"> {desc} </div>',

		'<div class="ping-and-owner">',
		'<div class="ping-left">   Ping auf Netz erlaubt: ja  </div>',
		'<div class="owner-right"> Verantwortlich: {owner}    </div>',
		'</div>',

		'</tpl>'   
	    );
    
	    var dvDetails = new Ext.DataView(
		{
		    id  : 'dvDetailsId',
		    tpl : dvDetailsTpl
		}
	    ); 

	    /****************************************************************/
	    /* Define Listview containing User-details for selected policy.
	     */
	    /****************************************************************/

	    var stUserLv = {
		id            : 'stUserLvId',
		xtype         : 'jsonstore',
		totalProperty : 'totalCount',
		root          : 'records',
		autoLoad      : false,
		remoteSort    : false,
		sortInfo      : { field: 'ip', direction: "ASC" },
		storeId       : 'stUserLvId',
		fields        : [
		    { name : 'ip', mapping : 'ip'        }
		],
		listeners : {
		    load : function( thisStore, records, options ) {
			var lvUserIPs =
			    Ext.getCmp('lvUserId');
			// Select first policy after store has loaded.
			lvUserIPs.select( 0 );
		    }
		}
	    };

	    var lvUser = new Ext.ListView(
		{
		    id            : 'lvUserId',
		    store         : stUserLv,
		    singleSelect  : true,
		    autoscroll    : true,
		    boxMinWidth   : 200,
		    columns       : [
			{
			    header    : 'IP-Adressen',
			    dataIndex : 'ip'
			}
		    ]
		}
	    );

	    /****************************************************************/
	    // Define viewport as BorderLayout.
	    /****************************************************************/

	    viewport = new Ext.Viewport(
		{
		    title        : 'NetspocWeb -- Web Interface For Netspoc',
		    layout       : 'border',
		    items: [
			{
			    id     : 'pNorthId',
			    region : 'north',
			    layout : 'fit',
			    layout : 'fit',
			    frame  : false,
			    tbar   : [
				{
				    text    : 'Verantwortungsbereich',
				    iconCls : 'icon-door_in',
				    scope   : this,
				    handler : function() {
					this.destroy();
					this.onLoginSuccess();
				    }
				},
				'->',
				{
				    text    : 'Abmelden',
				    iconCls : 'icon-door_out',
				    scope   : this,
				    handler : this.onLogout
				}
			    ]
			},
			{
			    id     : 'pCenterId',
			    region : 'center',
			    xtype  : 'container',
			    layout : 'fit',
			    items  : [
				{
				    xtype  : 'tabpanel',
				    activeTab: 0,
				    items: [
					{
					    title  : 'Dienstedetails',
					    xtype  : 'panel',
					    layout : 'anchor',
					    items  : [
						dvDetails,
						dvRules
					    ]
					},
					{
					    title  : 'User',
					    xtype  : 'panel',
					    layout : 'fit',
					    items  : [
						lvUser
					    ]
					}
				    ]
				}
			    ]
			},
			{
			    // xtype: 'panel' implied by default
			    id     : 'pLvPolicyId',
			    region : 'west',
			    width  : 300,  // initial size
			    split  : true, // resizable
			    items  : lvPolicy
			}
		    ]
		}
	    );
	    
	} // end buildViewport
    }; // end of return-closure
}(); // end of NetspocWeb.workspace function

	    
Ext.onReady( NetspocWeb.workspace.init, NetspocWeb.workspace );

	