

Ext.onReady(
    function() {
	
	var arrayData = [
	    ['Jay Garcia',    'MD', 'Software Engineer' ],
	    ['Aaron Baker',   'VA', 'Math-Teacher'      ],
	    ['Susan Smith',   'DC', 'Professor'         ],
	    ['Mary Stein',    'DE', 'Soccer-Pro'        ],
	    ['Bryan Shanley', 'NJ', 'Craftsman'         ],
	    ['Nyri Selgado',  'CA', 'Musician'          ]
	];
	var nameRecord = Ext.data.Record.create(
	    [
		{ name : 'name',  mapping : 0 },
		{ name : 'state', mapping : 1 },
		{ name : 'job',   mapping : 2 }
	    ]
	);
	var arrayReader = new Ext.data.ArrayReader({}, nameRecord);
	var memoryProxy = new Ext.data.MemoryProxy(arrayData);
	var store = new Ext.data.Store(
	    {
		reader : arrayReader,
		proxy  : memoryProxy,
		autoLoad : true
	    }
	);

	var colModel = new Ext.grid.ColumnModel(
	    [
		{
		    header : 'Full Name',
		    sortable : true,
		    dataIndex : 'name'
		},
		{
		    header : 'State',
		    dataIndex : 'state'
		}
	    ]
	);
	var gridView = new Ext.grid.GridView();
	var selModel = new Ext.grid.RowSelectionModel(
	    {
		singleSelect : true
	    }
	);

	var cb_group = new Ext.form.CheckboxGroup(
	    {
		xtype   : 'checkboxgroup',
		width   : 210,
		items   : [
		    {boxLabel : 'Expand Users',
		     name     : 'cb-exp-users'},
		    {boxLabel : 'Show Names',
		     name     : 'cb-show-names'}
		],
		listeners : {
		    'change' : function( cbg, checked ) {
			var grid = cbg.findParentByType( 'grid' );
			Ext.each( checked,
				  function( cb, index ) {
				      if ( cb.name ===
					   'cb-exp-users' ) {
					       console.log( "Users" );
					   }
				      else if ( cb.name ===
						'cb-show-names' ) {
						    console.log( "Names" );
						}
				      else { return; }
				  }
				);
/*
			var store = grid.getStore();
			store.load(
			    {
				params : {
				    'expand_users'     : expand_users,
				    'display_property' : disp_prop,
				    'services'         : services
				}
			    }
			);
*/
		    }
		}
	    }
	);
	
	var tbar = new Ext.Toolbar(
	    {
		items : [
		    'Print',
		    {
			iconCls : 'icon-printer',
			tooltip : 'Open print view',
			scope   : this
		    },
		    {xtype: 'tbspacer', width: 50},
		    cb_group
		]
	    }
	);

	var grid = new Ext.grid.GridPanel(
	    {
		tbar       : tbar,
		autoHeight : true,
		width      : 500,
		store      : store,
		view       : gridView,
		colModel   : colModel,
		selModel   : selModel
	    }
	);

	var viewport = new Ext.Viewport(
	    {
		layout: 'border',
		items: [
		    {
			region : 'center',
			xtype  : 'panel',
			items  : [
			    grid
			]
		    }
		]
	    }
	);
    }
);

