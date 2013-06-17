
Ext.define(
    'PolicyWeb.controller.Network', {
        extend : 'Ext.app.Controller',
        stores : [ 'Networks', 'NetworkResources' ],
        refs   : [
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
                    'networkview': {
                        beforeactivate : this.onBeforeActivate
                    },
                    'networklist': {
                        select : this.onNetworkSelected
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
        },

	onBeforeActivate : function() {
            var store = this.getNetworksStore();
            store.load();
        },

	onNetworkSelected : function( rowmodel, network, index, eOpts ) {
            var store = this.getNetworkResourcesStore();
            if ( network ) {
                var name  = network.get( 'name' );
                store.getProxy().extraParams.network = name;
                store.load();
            }
            else {
                store.removeAll();
            }
        }
    }
);