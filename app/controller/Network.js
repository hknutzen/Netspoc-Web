/*
(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>
            Heinz Knutzen     <heinz.knutzen@gmail.com>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

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
                selector : 'networkview button[iconCls="icon-cancel"]',
                ref      : 'networkCancelButton'
            },
            {
                selector : 'networkresources',
                ref      : 'networkResourcesGrid'
            }
        ],

        init : function() {
            
            this.control(
                {
                    'networkview button[iconCls="icon-accept"]': {
                        click  : this.onConfirmNetworkSelection
                    },
                    'networkview button[iconCls="icon-cancel"]': {
                        click  : this.onCancelNetworkSelection
                    },
                    'networkview' : {
                        beforeactivate : this.onBeforeActivate
                    },
                    'networklist' : {
                        select   : this.onSelect,
                        deselect : this.onSelect
                    }
                }
            );
        },

	onLaunch : function() {
            var store = this.getNetworksStore();
            store.on( 'load', this.preSelect, this );

            var res_store = this.getNetworkResourcesStore();
            res_store.on( 'load', this.preCollapse, this );

            appstate.addListener(
                'ownerChanged', 
                this.resetNetworks,
                this
            );
            appstate.addListener(
                'historyChanged', 
                this.resetNetworks,
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

        resetNetworks : function () {
            if ( appstate.getInitPhase() ) { return; }

            // Reset possibly previously chosen networks.
            appstate.changeNetworks( '' );
            
            // Reset "Eigene Netze"-button to default.
            this.setOwnNetworksButton( 'default' );
            
            // Reload network store, but only if network
            // tab is currently active.
            // Also reset network resources store.
            var cardpanel = this.getMainCardPanel();
            var index = cardpanel.getLayout().getActiveItemIndex();
            if ( index === 1 ) {
                this.getNetworksStore().load();
                this.getNetworkResourcesStore().removeAll();
            }
        },

        preCollapse : function (store, records) {
            var threshold = 100;
            var groups    = store.getGroups().getRange();
            var grid      = this.getNetworkResourcesGrid();
            var grouping  = get_store_feature( grid, 'grouping' ); // see common.js
            Ext.each(
                groups,
                function(group, index) {
                    if ( group.length > threshold ) {
                        grouping.collapse( group.getGroupKey() );
                    }
                }
            );
        },

        preSelect : function () {
            var grid = this.getNetworksGrid();
            var networks_csv = appstate.getNetworks();
            var net_hash = {};
            Ext.each(
                networks_csv.split(','),
                function( key ) {
                    net_hash[key] = true;
                }
            );
            var net_filter = function(item) {
                return net_hash[item.get('name')];
            };
            var all_records = grid.getStore().getRange();
            var records = all_records.filter( net_filter );
            grid.getSelectionModel().select( records );
        },

	onSelect : function( sm, network ) {
            this.onSelectionChange( sm, sm.getSelection() );
        },

        onSelectionChange : function( sm, selected ) {
            var confirm_button = this.getNetworkConfirmButton();
            var cancel_button  = this.getNetworkCancelButton();
            var res_store      = this.getNetworkResourcesStore();

            // Enable previously disabled buttons.
            if ( confirm_button.disabled ) {
                confirm_button.enable();
            }
            if ( cancel_button.disabled ) {
                cancel_button.enable();
            }
            // Load resources store for selected networks.
            if ( selected.length > 0 ) {
                res_store.getProxy().extraParams.selected_networks =
                    record_names_as_csv( selected );
                res_store.load();
            }
            else {
                res_store.removeAll();
            }
        },

        onCancelNetworkSelection : function ( button, event ) {
            var networks       = '';
            var grid           = this.getNetworksGrid();
            var sm             = grid.getSelectionModel();
            var sel            = sm.getSelection();
            var confirm_button = this.getNetworkConfirmButton();
            var cancel_button  = this.getNetworkCancelButton();
            var res_store      = this.getNetworkResourcesStore();

            cancel_button.disable();

            // Make selection empty and auto-confirm this
            // empty selection.
            sm.deselectAll( true ); // prevent deselect events
            appstate.changeNetworks( networks );
            confirm_button.fireEvent( 'click', confirm_button );
            
            // Erase possibly displayed network resources.
            res_store.removeAll();
        },

        onConfirmNetworkSelection : function ( button, event ) {
            var networks        = '';
            var grid            = this.getNetworksGrid();
            var sm              = grid.getSelectionModel();
            var sel             = sm.getSelection();
            var store_count     = grid.getStore().getTotalCount();
            var selection_count = sm.getCount();

            // Button will be enabled again on selection change.
            button.disable();

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