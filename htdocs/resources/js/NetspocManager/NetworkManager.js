
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.NetworkManager
 * @extends Ext.Panel
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype policymanager
 **/

var choose_networks_wnd = false;

NetspocManager.NetworkManager = Ext.extend(
    Ext.Container,
    {
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildNetworkListPanel(),
                this.buildNetworkDetailsView()
            ];
            
            NetspocManager.NetworkManager.
		superclass.initComponent.call(this);

	    // Listen to "networksChanged" event.
            var appstate = NetspocManager.appstate;
            appstate.addListener(
                'networksChanged', 
                function () {
		    // Reset possibly previously chosen networks.
		    NetspocManager.appstate.changeNetworks( '', true );
		    // If network-chooser-window was created before,
		    // reload store of grid that gets 
		    // displayed in choose-network-window.
		    if ( Ext.isObject( choose_networks_wnd ) ) {
			var grid = choose_networks_wnd.items.items[0];
			grid.getStore().load();
		    }
		    // Activate network list in card panel.
		    this.activateNetworkList();
                },
		this
	    );                    
	    // Listen to "ownerChanged" event.
            appstate.addListener(
                'ownerChanged', 
                function () {
		    // Reset possibly previously chosen networks.
		    NetspocManager.appstate.changeNetworks( '' );

		    // If network-chooser-window was created before,
		    // reload store of grid that gets 
		    // displayed in choose-network-window.
		    if ( Ext.isObject( choose_networks_wnd ) ) {
			var grid = choose_networks_wnd.items.items[0];
			grid.getStore().load();
		    }
		    // Reset "Eigene Netze"-button to default.
		    var top_card_panel = this.findParentByType( 'panel' );
		    this.setOwnNetworksButton( top_card_panel, 'default' );

		    // Clear network details view.
		    var nrl = this.findByType( 'networkresourceslist' );
		    var view = nrl[0];
		    view.getStore().removeAll();
                },
		this
	    );                    
        },

        buildNetworkListPanel : function() {
            var networklist = {
                xtype    : 'networklist',
                proxyurl : 'get_networks',
                itemId   : 'networkListId',
                flex     : 2,
                border   : false,
                listeners : {
                    scope           : this,
                    selectionchange : this.onNetworkListSelected
                }
            };
	    var routerpanel = {
	    };
            return {
                xtype          : 'cardprintactive',
		id             : 'netlistPanelId',
                flex           : 2,
                activeItem     : 0,
                deferredRender : false,
                tbar : [
                    {
                        text         : 'Netze',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
                        pressed      : true,
                        scope        : this,
                        handler      : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 0 );
			    var active = cardPanel.layout.activeItem;
			    active.loadStoreByParams( {} );
                        }
                    },
                    {
                        text         : 'Router',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
                        scope        : this,
                        handler      : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 1 );
                        }
                    },
                    {
			text         : 'Netzauswahl',
                        toggleGroup  : 'netRouterGrp',
                        enableToggle : true,
			scope        : this,
                        handler      : this.createAndShowNetworkChooser
                    },
                    '->',
                    {
                        xtype : 'printbutton'
                    }
                ],
		listeners : {
		    beforerender :  function ( me ) {
			var active = me.items.items[0];
			active.loadStoreByParams( {} );
                    }
		},
                items     : [
		    networklist,
		    routerpanel
                ]
            };
        },

        buildNetworkDetailsView : function() {
            return {
                xtype : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                deferredRender : false,
                tbar : [
                    {
                        text          : 'Enthaltene Ressourcen',
                        toggleGroup   : 'containedResourcesGrp',
                        scope         : this,
                        handler       : function ( button ) {
                            var cardPanel = button.findParentByType( 'panel' );
                            cardPanel.layout.setActiveItem( 0 );
                        }
                    },
                    '->',
                    {
                        xtype : 'printbutton'
                    }
                ],
                items : [
                    this.buildNetworkDetails()
                ]
            };
        },

        buildNetworkDetails : function() {
            return {
                xtype : 'networkresourceslist'
            };
        },

        onNetworkListSelected : function( dataview, selections ) {
	    if ( dataview ) {
		var store = Ext.StoreMgr.get('stNetworkDetailsId');
		var selected = dataview.getSelectedRecords();
		if ( selected ) {
		    if ( selected[0] ) {
			var selname  = selected[0].data.name;
			store.load( { params : { network : selname } } );
		    }
		}
		else {
                    store.removeAll();
		}
	    }
        },

	createAndShowNetworkChooser : function() {
	    if ( !choose_networks_wnd ) {
		choose_networks_wnd = this.createNetworkChooserWindow();
	    }
	    choose_networks_wnd.show();
	},

	createNetworkChooserWindow : function() {
	    var grid   = this.createGrid();
	    var button = this.createButton();
	    var wnd    = new Ext.Window(
		{
		    layout      : 'anchor',
		    width       : 600,
		    height      : 500,
		    closeAction : 'hide',
		    items       : [ grid, button ]
		}
	    );
	    return wnd;
	},

	createGrid : function() {
	    var selection_model = new Ext.grid.CheckboxSelectionModel();
	    var store = {
		xtype         : 'netspocstatestore',
		proxyurl      : 'get_networks',
		storeId       : 'chooseNetworksStoreId',
		sortInfo      : { field: 'ip', direction: "ASC" },
		fields        : [
		    { name : 'name',   mapping : 'name'  },
		    { name : 'ip',     mapping : 'ip',
		      sortType : function ( value ) {
			  var array = value.split('/');
			  return ip2numeric( array[0] );
		      }
		    },
		    { name : 'owner' , mapping : 'owner' }
		]
	    };
	    
	    var col_model = new Ext.grid.ColumnModel(
		{
		    defaults: {
			sortable : true
		    },
		    columns   :  [
			selection_model,
			{
			    header    : 'IP-Adresse',
			    dataIndex : 'ip'
			},
			{
			    header    : 'Name',
			    dataIndex : 'name'
			},
			{
			    header    : 'Verantwortungsbereich',
			    dataIndex : 'owner'
			}
		    ]
		}
	    );
            var grid = new Ext.grid.GridPanel(
		{
		    store      : store,
		    itemId     : 'chooseNetworkGridId',
		    anchor     : '100%, 85%',
		    border     : false,
		    viewConfig : {
			forceFit : true
		    },
		    colModel   : col_model,
		    sm         : selection_model,
		    listeners  : {
			beforerender : function ( component ) {
			    component.getStore().load();
			},
			afterrender : function ( component ) {
			    //console.log( component );
			    component.getSelectionModel().selectAll();
			}
		    }
		}
	    );
	    return grid;
	},

	createButton : function () {
	    var button =  {
		xtype      : 'button',
		fieldLabel : 'Sicht auf Dienste/Freischaltungen ' +
	            'auf die selektierten Netze einschränken',
		text       : 'Auswählen',
		handler    : this.onChooseButtonClick
	    };
	    var form = new Ext.form.FormPanel(
		{
		    bodyStyle  : 'padding : 5px',
		    labelWidth : 165,
		    labelAlign : 'top',
		    defaults   : {
			// applied to each contained item
		    },
		    items: [
			button
		    ]
		}
	    );
	    return {
		anchor  : '100%, 15%',
		bodyCfg : {
		    tag : 'center'
		},
		frame   : true,
		items   : [ form ]
	    };
	},

	onChooseButtonClick : function ( button, event ) {
	    var wnd  = button.findParentByType( 'window' );
	    var grid = wnd.items.items[0];
	    var sm   = grid.getSelectionModel();
	    var sel  = sm.getSelections();

	    // Find cardpanel, activate network-list-panel
	    // and make "Netze"-button look pressed.
	    var card = Ext.getCmp("netlistPanelId");
	    var top_card = card.findParentByType( 'panel' );
	    var card_buttons = card.getTopToolbar().findByType( 'button' );
	    var store_count = grid.getStore().getTotalCount();
	    var selection_count = sm.getCount();
	    var nm = card.findParentByType( 'networkmanager' );

	    // Selecting all records is to be treated as
	    // if none were selected.
	    if ( selection_count === store_count || selection_count == 0 ) {
		// Reset button to "Eigene Netze".
		nm.setOwnNetworksButton( top_card, 'default' );
		sel = [];
	    }
	    else if ( selection_count > 0 ) {
		// Give visual feedback to user to indicate
		// restricted view within area of ownership.
		nm.setOwnNetworksButton( top_card );
	    }
	    card.layout.setActiveItem(0);
	    card_buttons[0].toggle( true );
	    wnd.hide();
	    var networks = record_names_as_csv( sel );
	    NetspocManager.appstate.changeNetworks( networks );
	},

	activateNetworkList : function () {
	    // Find cardpanel, activate network-list-panel
	    // and make "Netze"-button look pressed.
	    var card = Ext.getCmp("netlistPanelId");
	    card.layout.setActiveItem(0);
	    card.doLayout();
	    var card_buttons = card.getTopToolbar().findByType( 'button' );
	    card_buttons[0].toggle( true );
	},

	setOwnNetworksButton : function ( panel, status ) {
	    var toolbar = panel.getTopToolbar();
	    var top_buttons = toolbar.findByType( 'button' );
	    var own_nets_button = top_buttons[1];
	    if ( status === 'default' ) {
		own_nets_button.setIconClass( 'icon-computer_connect' );
		own_nets_button.setText( 'Eigene Netze' );
	    }
	    else {
		own_nets_button.setIconClass( 'icon-exclamation' );
		own_nets_button.setText( 'Ausgewählte Netze' );
	    }
	}
    }
);

Ext.reg( 'networkmanager', NetspocManager.NetworkManager );
