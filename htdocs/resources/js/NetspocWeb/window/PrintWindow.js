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
 			   width       : 668, 
 			   height      : 525,
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
	    var scale_fx = function(p) {
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
		p.el.addListener(
		    'click',
		    function ( event ) {
			var store = {
			    xtype       : 'groupingstatestore',
			    proxyurl    : 'get_data',
			    storeId     : 'dataStoreId',
			    sortInfo    : {
				field     : 'service',
				direction : 'ASC'
			    },
			    groupOnSort : true,
			    remoteGroup : true,
			    groupField  : 'service',
			    fields      : [
				{ name : 'service',  mapping : 'service'  },
				{ name : 'has_user', mapping : 'hasuser'  },
				{ name : 'action',   mapping : 'action'  },
				{ name : 'src',      mapping : function( node ) {
				      return bold_user( node, 'src' );
				  }
				},
				{ name : 'dst',      mapping : function( node ) {
				      return bold_user( node, 'dst' );
				  }
				},
				{ name : 'srv',      mapping : function( node ) {
				      return node.srv.join( '<br>' );
				  }
				}
			    ]
			};
/*
			var gg = new Ext.grid.GridPanel(
			    {
				// A groupingStore is required for a GroupingView
				store : store,
				colModel: new Ext.grid.ColumnModel(
				    {
					columns : [
					    {
						id : 'company',
						header : 'Company',
						width: 60,
						dataIndex: 'company'
					    },
					    {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price', groupable: false},
            {header: 'Change', dataIndex: 'change', renderer: Ext.util.Format.usMoney},
            {header: 'Industry', dataIndex: 'industry'},
            {header: 'Last Updated', renderer: Ext.util.Format.dateRenderer('m/d/Y'), dataIndex: 'lastChange'}
        ]			    }
			);
*/
			var w = new Ext.Window(
 			    {
				title       : 'Grid TEST',
 				width       : 640, 
 				height      : 480,
 				layout      : 'fit',
				resizable   : false,
 				items       : [
				    gg
 				]
			    }
			);
			w.show();
			console.log( "HERE!" );
		    }
		);
	    };
	    var v      = Ext.getCmp( 'viewportId' );
	    var pm     = v.findByType("policymanager");
/*
	    var plists = v.findByType("policylist");
	    var plv    = plists[0];
	    var store  = plv.getStore();
	    var records = store.getRange();
	    var new_recs;
	    //console.log( records );

var data = [];
store.each(function(rec){
    data.push(rec.get('field'));
});
	    
*/	    
	    var bold_user = function ( node, what ) {
		if ( node.has_user === what || node.has_user === 'both' ) {
		    return '<span style="font-weight:bold;"> User </span>';
		}
		else {
		    return what === 'src' ?  node.src.join( '<br>' ) :
			node.dst.join( '<br>' );
		};
	    };


/*	    
	    var grp_store = new Ext.data.GroupingStore(
		{
		    autoDestroy : true,
		    reader      : reader,
		    data        : xg.dummyData,
		    sortInfo    : {field: 'company', direction: 'ASC'},
		    groupOnSort : true,
		    remoteGroup : true,
		    groupField  : 'industry'
		}
	    );
*/

	    var panel1 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services',
		listeners : {
		    afterrender : scale_fx
		}
	    };
	    var panel2 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services-user',
		listeners : {
		    afterrender : scale_fx
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
	    // addListener( eventName, Function fn, scope, options ) : Ext.Element
	    var panel4 = {
		width     : 320,
		height    : 240,
		baseCls   : 'print-services-user-owner',
		listeners : {
		    afterrender : scale_fx
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
	    console.log( "HERE!" );
	}

    }
);



