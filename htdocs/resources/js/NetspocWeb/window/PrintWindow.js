Ext.ns("NetspocWeb.window");

/**
 * @class NetspocWeb.window.PrintWindow
 * @extends Ext.Window
 * A class to hsmanage choice of owner to use after being logged in.
 * @constructor
 */

NetspocWeb.window.PrintWindow = Ext.extend(
    Ext.Window, {

	initComponent : function() {
            // Force defaults
            Ext.apply( this,
 		       {
			   title       : 'Druckformat auswählen',
 			   width       : 660, 
 			   height      : 520,
 			   layout      : 'fit',
			   resizable   : false,
			   closeAction : 'hide',
 			   items       : [
			       this.buildPanels()
 			   ],
			   focus     : function() {  // Focus
 			   }
		       }
		     );
	    
            NetspocWeb.window.PrintWindow.superclass.initComponent.call(this);
	},
	
	// Build four panels showing possible ways of printing.
	buildPanels : function() {

	    var displayed_services = function () {
		// Find out which services are currently displayed,
		// so URL-parameter "relation" can be set
		// appropriately.
		var v  = Ext.getCmp( 'viewportId' );
		var pl = v.findByType( 'policylist' );
		var tbar = pl[0].getTopToolbar();
		var button2param = {
		    'Eigene'   : 'owner',
		    'Genutzte' : 'user',
		    'Nutzbare' : 'visible',
		    'Alle'     : ''
		};
		var items = tbar.items.items;
		var currently_displayed = '';
		for ( i in items  ) {
		    if ( !items[i].text &&
			 !button2param[items[i]] ) {
			     continue;
			 }
		    if ( items[i].pressed === true ) {
			currently_displayed =
			    button2param[items[i].text];
		    }
		}
		return currently_displayed;
	    };

	    var scale_fx = function( p, opt ) {
		p.el.scale( 300, 220 );
		p.el.addListener(
		    'mouseenter',
		    function ( event ) {
			p.el.scale( 310, 230 );
		    }
		);
		p.el.addListener(
		    'mouseleave',
		    function ( event ) {
			p.el.scale( 300, 220 );
		    }
		);
		if ( opt === 'scale_only' ) {
		    return;
		}
		p.body.on(
		    'click',
		    function ( event, html_el, options ) {

			// Hide parent window.
			var wnd = this.findParentByType( 'window' );
			wnd.hide();

			var currently_displayed = displayed_services();
			
			var reader = new Ext.data.JsonReader(
			    {
    				totalProperty   : 'totalCount',
				successProperty : 'success',
				root            : 'records',
				remoteSort      : false,
				fields      : [
				    { name : 'service', mapping : 'service'  },
				    { name : 'action',  mapping : 'action'  },
				    { name : 'src',     mapping : function( node ) {
					  return node.src.join( '<br>' );
				      }
				    },
				    { name : 'dst',      mapping : function( node ) {
					  return node.dst.join( '<br>' );
				      }
				    },
				    { name : 'proto',      mapping : function( node ) {
					  return node.proto.join( '<br>' );
				      }
				    }
				]
			    }
			);

			var grid_colmodel = new Ext.grid.ColumnModel(
			    {
				columns : [
				    {
					header    : 'Dienst',
					dataIndex : 'service'
				    },
				    {
					header    : 'Aktion',
					dataIndex : 'action'
				    },
				    {
					header    : 'Quelle',
					dataIndex : 'src',
					groupable : false
				    },
				    {
					header    : 'Ziel', 
					dataIndex : 'dst'
				    },
				    {
					header    : 'Protokoll',
					dataIndex : 'proto'
				    }
				]
			    }
			);

			var tpl = '{text} ({[values.rs.length]} ' +
			    '{[values.rs.length > 1 ? "Regeln" : "Regel"]})';

			var grid_view = new Ext.grid.GroupingView(
			    {
				forceFit          : true,
				hideGroupedColumn : true,
				groupTextTpl      : tpl
			    }
			);

			// Change ColumnModel and JsonReader appropriately.
			if ( opt === 'get_services_owners_and_admins' ) {
			    grid_colmodel =  new Ext.grid.ColumnModel(
				{
				    columns : [
					{
					    header    : 'Dienst',
					    dataIndex : 'service'
					},
					{
					    header    : 'Verantwortlichkeit',
					    dataIndex : 'srv_owner'
					},
					{
					    header    : 'Verantwortliche Personen',
					    dataIndex : 'admins'
					}
				    ]
				}
			    );
			    reader =  new Ext.data.JsonReader(
				{
    				    totalProperty   : 'totalCount',
				    successProperty : 'success',
				    root            : 'records',
				    remoteSort      : false,
				    fields      : [
					{ name : 'service',   mapping : 'service'  },
					{ name : 'srv_owner', mapping : function( node ) {
					      return node.srv_owner.join( '<br>' );
					  }
					},
					{ name : 'admins',    mapping : function( node ) {
					      return node.admins.join( '<br>' );
					  }
					}
				    ]
				}
			    );
			}

			var store = {
			    xtype       : 'groupingstatestore',
			    proxyurl    : opt,
			    autoLoad    : false,
			    reader      : reader,
			    sortInfo    : {
				field     : 'service',
				direction : 'ASC'
			    },
			    groupOnSort : true,
			    remoteGroup : true,
			    groupField  : 'service'
			};

			var tbar = [
			    'Drucken:',
			    {
				iconCls : 'icon-printer',
				tooltip : 'Druck-Fenster öffnen',
				scope   : this,
				handler : function ( button ) {
				    var grid = button.findParentByType( 'grid' );
				    Ext.ux.Printer.print( grid );
				}
			    }
			];
			
			var gg = new Ext.grid.GridPanel(
			    {
				store     : store,
				colModel  : grid_colmodel,
				view      : grid_view,
				tbar      : tbar,
				listeners : {
				    beforerender : function ( grid ) {
					grid.getStore().load(
					    {
						'params' : {
						    'relation' : currently_displayed
						}
					    }
					);
				    }
				}
			    }
			);

			var w = new Ext.Window(
 			    {
				title       : 'Alle Dienste im expandierten Format',
				id          : 'srvRulesWndId', // see PolicyManager
 				width       : 640, 
 				height      : 480,
 				layout      : 'fit',
				resizable   : true,
 				items       : [
				    gg
 				]
			    }
			);
			w.show();
		    },
		    p  // the panel as scope
		);
	    };

	    var panel1 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services',
		listeners : {
		    afterrender : function ( p ) {
			scale_fx( p, 'get_services_and_rules' );
		    }
		}
	    };
	    var panel2 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services-user',
		listeners : {
		    afterrender : function ( p ) {
			scale_fx( p, 'get_services_owners_and_admins' );
		    }
		}
	    };
	    var panel3 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services-owner',
		listeners : {
		    afterrender : scale_fx
		}
	    };
	    var panel4 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services-user-owner',
		listeners : {
		    afterrender : function ( p ) {
			scale_fx( p, 'scale_only' );
			var currently_displayed = displayed_services();
			//console.log( currently_displayed );
		    }
		}

	    };
	    var top_row = {
		layout : 'hbox',
		items  : [
		    panel1,
		    panel2
		]
	    };
	    var bottom_row = {
		layout : 'hbox',
		items  : [
		    panel3,
		    panel4
		]
	    };

	    var container_panel = {
		layout : 'anchor',
		frame  : true,
		items  : [
		    top_row,
		    bottom_row
		],
		listeners : {
		    afterrender : function(p) {
			//p.el.boxWrap( "x-box-blue" );
		    },
		    single : true  // Remove the listener after first invocation
		}
	    };
	    return container_panel;
	},

	onPanelClick : function () {
	    //console.log( "HERE!" );
	},
	
    } // end of params extending window class
);


