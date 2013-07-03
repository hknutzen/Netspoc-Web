
Ext.define(
    'PolicyWeb.controller.Network', {
        extend : 'Ext.app.Controller',
        stores : [ 'Networks', 'NetworkResources' ],
        refs   : [
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'
            },
            {
                selector : 'networklist',
                ref      : 'networksGrid'
            },
            {
                selector : 'networkview button[iconCls="icon-accept"]',
                ref      : 'networkConfirmButton'
            },
            {
                selector : 'networkresources',
                ref      : 'networkResourcesGrid'
            }
        ],

        init : function() {
            
            this.control(
                {
                    'networkview button[toggleGroup="netRouterGrp"]': {
                        click  : this.onNetworkRouterButtonClick
                    },
                    'networkview button[iconCls="icon-accept"]': {
                        click  : this.onConfirmNetworkSelection
                    },
                    'networklist': {
                        selectionchange : this.onSelectionChange,
                        select          : this.onSelect
                    }
                }
            );
        },

	onLaunch : function() {
            var store = this.getNetworksStore();
            store.on( 'load',
                      function () {
                          this.getNetworksGrid().select0();
                      },
                      this
                    );
            appstate.addListener(
                'ownerChanged', 
                function () {
                    // Reset possibly previously chosen networks.
                    appstate.changeNetworks( '' );

                    // Reset "Eigene Netze"-button to default.
                    this.setOwnNetworksButton( 'default' );

                    // Reload network store.
                    store.load();
                },
                this
            );
        },

	onBeforeActivate : function() {
            this.getNetworksStore().load(
                {
                    params : {
                        chosen_networks : ''
                    }
                }
            );
        },

	onSelect : function( sm, network ) {
            this.onSelectionChange( sm, sm.getSelection() );
        },

	onNetworkRouterButtonClick : function( button ) {
            var card_panel = button.findParentByType( 'panel' );
            if ( button.getText() === 'Netze'  ) {
                card_panel.layout.setActiveItem( 0 );
                this.getNetworksStore().load(
                    {
                        params : {
                            chosen_networks : ''
                        }
                    }
                );
            }
            else {
                card_panel.layout.setActiveItem( 1 );
                this.getNetworkResourcesStore().removeAll();
            }
        },

        onSelectionChange : function( sm, selected, opts ) {
            var button = this.getNetworkConfirmButton();
            if ( button.disabled ) {
                button.enable();
            }
            var store = this.getNetworkResourcesStore();
            if ( selected ) {
                store.getProxy().extraParams.selected_networks =
                    record_names_as_csv( selected );
                store.load();
            }
            else {
                store.removeAll();
            }
        },

        onConfirmNetworkSelection : function ( button, event ) {
            // Button will be enabled again on selection change.
            button.disable();

            var networks = '';
            var grid = this.getNetworksGrid();
            var sm   = grid.getSelectionModel();
            var sel  = sm.getSelection();
            var store_count = grid.getStore().getTotalCount();
            var selection_count = sm.getCount();

            // Selecting all records is to be treated as
            // if none were selected.
            if ( selection_count === store_count || selection_count === 0 ) {
                // Reset button to "Eigene Netze".
                this.setOwnNetworksButton( 'default' );
            }
            else if ( selection_count > 0 ) {
                // Give visual feedback to user to indicate
                // restricted view within area of ownership.
                this.setOwnNetworksButton();
                networks = record_names_as_csv( sel );
            }
            appstate.changeNetworks( networks );
        },

        activateNetworkList : function () {
            // Find cardpanel, activate network-list-panel
            // and make "Netze"-button look pressed.
            var card = Ext.getCmp("netlistPanelId");
            if(!card.rendered) {
                return;
            }
            card.layout.setActiveItem(0);
            card.doLayout();
            var card_buttons = card.getTopToolbar().findByType( 'button' );
            card_buttons[0].toggle( true );
        },

        setOwnNetworksButton : function ( status ) {
            var panel = this.getMainCardPanel();
            var toolbar = panel.getDockedItems('toolbar[dock="top"]')[0];
            var own_nets_button = toolbar.child(
                'button[iconCls="icon-computer_connect"]' );
            if ( !own_nets_button ) {
                own_nets_button = toolbar.child(
                    'button[iconCls="icon-exclamation"]' );
            }
            if ( status === 'default' ) {
                own_nets_button.setIconCls( 'icon-computer_connect' );
                own_nets_button.setText( 'Eigene Netze' );
            }
            else {
                own_nets_button.setIconCls( 'icon-exclamation' );
                own_nets_button.setText( 'Ausgewählte Netze' );
            }
        }
    }
);