
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
                selector : 'networkresources',
                ref      : 'networkResourcesGrid'
            }
        ],

        init : function() {
            
            this.control(
                {
                    'networklist': {
                        select : this.onNetworkSelected
                    },
                    'networkview button[toggleGroup="netRouterGrp"]': {
                        click : this.onNetworkRouterButtonClick
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
            store = this.getNetworkResourcesStore();
            store.on( 'load',
                      function () {
                          this.getNetworkResourcesGrid().select0();
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
                    this.getNetworksStore().load();
                },
                this
            );
        },

	onBeforeActivate : function() {
            var store = this.getNetworksStore();
            store.load();
        },

	onNetworkSelected : function( rowmodel, network, index, eOpts ) {
            var store = this.getNetworkResourcesStore();
            if ( network ) {
                var name = network.get( 'name' );
                store.getProxy().extraParams.network = name;
                store.load();
            }
            else {
                store.removeAll();
            }
        },

	onNetworkRouterButtonClick : function( button ) {
            var card_panel = button.findParentByType( 'panel' );
            var active;
            var store;
              if ( button.getText() === 'Netze'  ) {
                active = card_panel.layout.setActiveItem( 0 );
                if ( active ) {
                    active.getStore().load();
                }
            }
            else {
                active = card_panel.layout.setActiveItem( 1 );
                store = this.getNetworkResourcesStore();
                store.removeAll();
            }
        },

        setOwnNetworksButton : function ( status ) {
            var panel = this.getMainCardPanel();
            var toolbar = panel.getDockedItems('toolbar[dock="top"]')[0];
            var own_nets_button = toolbar.child(
                'button[iconCls="icon-computer_connect"]' );
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