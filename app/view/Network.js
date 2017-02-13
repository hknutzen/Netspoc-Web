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
    'PolicyWeb.view.Network',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.networkview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildNetworkListPanel(),
                this.buildNetworkResourcesView()
            ];
            this.callParent(arguments);
        },
        
        buildNetworkListPanel : function() {
            var networklist = Ext.create(
                'PolicyWeb.view.panel.grid.Networks',
                {
                    id : 'grid_own_networks'
                }
            );
            return {
                xtype          : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
                tbar : [
                    'Netzauswahl',
                    {
                        id           : 'btn_confirm_network_selection',
                        text         : 'Bestätigen',
                        iconCls      : 'icon-accept',
                        disabled     : true,
                        enableToggle : false
                    },
                    {
                        id           : 'btn_cancel_network_selection',
                        text         : 'Aufheben',
                        iconCls      : 'icon-cancel',
                        disabled     : true,
                        enableToggle : false
                    },
                    '->',
                    {
                        xtype   : 'printbutton',
                        tooltip : 'Druckansicht für die Liste der eigenen Netze'
                    }
                ],
                items     : [
                    networklist
                ]
            };
        },

        buildNetworkResourcesView : function() {
            return {
                xtype : 'cardprintactive',
                flex           : 2,
                activeItem     : 0,
                layoutConfig   : { deferredRender : false },
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
                        xtype   : 'printbutton',
                        tooltip : 'Druckansicht für die Ressourcen der aktuell selektierten Netze'
                    }
                ],
                items : [
                    this.buildNetworkResources()
                ]
            };
        },

        buildNetworkResources : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.NetworkResources'
            );
        }
    }
);

