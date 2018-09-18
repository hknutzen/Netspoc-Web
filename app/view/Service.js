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

var search_window;
var print_window;


Ext.define(
    'PolicyWeb.view.Service',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.serviceview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items = [
                this.buildServiceListPanel(),
                this.buildServicePropertiesView()
            ];
            this.callParent(arguments);
        },
        
        buildServiceListPanel : function() {
            return {
              xtype : 'servicelist'
            };
        },

        buildServicePropertiesView : function() {
            var details = this.buildServiceDetailsView();
            var user    = this.buildServiceUserView();
            var srv_props = Ext.create(
                'PolicyWeb.view.panel.card.PrintActive', 
                {
                    id           : "pnl_service_details",
                    flex         : 7,
                    activeItem   : 0,
                    layoutConfig : {
                        deferredRender : false,
                        // Sonst wird der Container mit 'trigger' 
                        // bei multi Owner nicht korrekt angezeigt,
                        // wenn man zwischen User und Details 
                        // wechselt.
                        layoutOnCardChange : true
                    },
                    dockedItems  : [
                        {
                            xtype : 'toolbar',
                            dock  : 'top',
                            items : [
                                {   
                                    id            : 'btn_service_details',
                                    text          : 'Details zum Dienst',
                                    toggleGroup   : 'polDVGrp',
                                    enableToggle  : true,
                                    pressed       : true
                                },
                                '-',
                                {   
                                    id           : 'btn_service_user',
                                    text         : 'Benutzer (User) des Dienstes',
                                    toggleGroup  : 'polDVGrp',
                                    enableToggle : true
                                },
                                '->',
                                {
                                    id      : 'btn_print_rules',
                                    xtype   : 'printbutton',
                                    tooltip : 'Druckansicht für Regeln oder User des aktuell ausgewählten Dienstes'
                                }
                            ]
                        },
                        {
                            xtype : 'toolbar',
                            dock  : 'top',
                            items : [
                                {   
                                    id           : 'btn_service_user_add',
                                    iconCls      : 'icon-add'
                                },
                                {   
                                    id           : 'btn_service_user_del',
                                    iconCls      : 'icon-delete'
                                },
                                '-',
                                {
                                    xtype    : 'checkbox',
                                    id       : 'cb_expand_users',
                                    name     : 'expand_users',
                                    boxLabel : 'User expandieren'
                                },
                                {
                                    id       : 'cb_show_names',
                                    xtype    : 'checkbox',
                                    name     : 'display_property',
                                    boxLabel : 'Namen statt IPs'
                                },
                                {   
                                    id        : 'cb_filter_search',
                                    xtype     : 'checkbox',
                                    name      : 'filter_rules',
                                    boxLabel  : 'Filtern nach Suche',
                                    checked   : true,
                                    disabled  : true,
                                    listeners : {
                                        afterrender: function(c) {
                                            Ext.create(
                                                'Ext.tip.ToolTip', {
                                                    target : c.getEl(),
                                                    html   : 'Alle Regeln oder nur zum Suchergebnis passende anzeigen' 
                                                }
                                            );
                                        }
                                    }
                                }
                            ]
                        }
                    ],
                    items : [
                        details,
                        user
                    ]
                }
            );
            return srv_props;
        },

        buildServiceUserView : function() {
            return {
                layout : 'border',
                items  : [
                    this.buildUserView(),
                    this.buildUserEmails()
                ]
            };
        },

        buildUserView : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Users',
                {
                    region : 'center'
                }
            );
        },
        
        buildUserEmails : function() {
            var store = Ext.create(
                'PolicyWeb.store.Emails'
            );
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    region : 'south',
                    id     : 'userEmails',
                    store  : store
                }
            );
        },

        buildServiceDetails : function() {
            return Ext.create(
                'PolicyWeb.view.panel.form.ServiceDetails',
                {
                    region : 'north'
                }
            );
        },

        buildServiceRules : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Rules',
                {
                    id        : 'grid_rules',
                    region    : 'center',
                    printview : function () {
                        this.fireEvent( 'printrules' );
                    }
                }
            );
        },

        buildServiceEmails : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    region : 'south',
                    id     : 'ownerEmails'
                }
            );
        },

        buildServiceDetailsView : function() {
            var details = this.buildServiceDetails();
            var rules   = this.buildServiceRules();
            var emails  = this.buildServiceEmails();
            return {
                layout : 'border',
                items  : [
                    details,
                    rules,
                    emails
                ]
            };
        }
    }
);

