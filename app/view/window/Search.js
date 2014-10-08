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
    'PolicyWeb.view.window.Search',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.searchwindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'IP-Adresse oder Zeichenkette suchen',
                    width       : 350, 
                    height      : 430,
                    resizable   : false,
                    closeAction : 'hide',
                    items       : [
                        this.buildSearchForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildSearchForm : function () {
            var datatip = new Ext.ux.DataTip();
            var form = Ext.widget(
                {
                    xtype         : 'form',
                    plugins       : datatip,
                    buttonAlign   : 'center',
                    bodyPadding   : 5,
                    width         : '100%',
                    fieldDefaults : {
                        labelAlign : 'left',
                        msgTarget  : 'top'
                    },
                    items : [
                        this.buildTabPanel(),
                        this.buildOptionsFieldSet(),
                        this.buildGeneralOptionsFieldSet()
                    ],
                    buttons : [
                        {
                            text  : 'Suche starten'
                        }
                    ]
                }
            );
            return form;
	},
        
        buildTabPanel : function() {
            var tab_panel = {
                xtype     : 'tabpanel',
                plain     : true,
                activeTab : 0,
                height    : 200,
                defaults  : {
                    bodyPadding : 10
                },
                items : [
                    this.buildIPSearchTab(),
                    this.buildGeneralSearchTab()
                ]
            };
            return tab_panel;
        },

        buildGeneralSearchTab : function() {
            var textfield = {
                xtype     : 'textfield',
                name      : 'search_string',
                blankText : 'Eine Suche ohne Suchbegriff macht keinen Sinn',
                emptyText : 'Suchbegriff eingeben'
            };

            var fieldset = {
                xtype       : 'fieldset',
                title       : 'Suchbegriff',
                defaults    : { anchor : '100%' },
                items       : [
                    textfield
                ]
            };
            return {
                title    : 'Allgemeine Suche',
                layout   : 'anchor',
                items : [
                    fieldset,
                    this.buildOptionsCheckboxGroup()
                ]
            };
        },

        buildOptionsCheckboxGroup : function() {
            return {
                xtype       : 'checkboxgroup',
                columns     : 1,
                flex        : 5,
                defaults    : {
                    checked : false
                },
                items       : [
                    {
                        boxLabel   : 'Suche auch in Dienstbeschreibungen',
                        checked    : true,
                        name       : 'search_in_desc'
                    }
                ]
            };
        },
        
        buildGeneralOptionsCheckboxGroup : function() {
            return {
                xtype       : 'checkboxgroup',
                columns     : 1,
                flex        : 5,
                defaults    : {
                    checked : false
                },
                items       : [
                    {
                        boxLabel   : 'Groß-/Kleinschreibung beachten',
                        name       : 'search_case_sensitive'
                    },
                    {
                        boxLabel   : 'Suchergebnisse nur mit ' +
                            'exakter Übereinstimmung',
                        name       : 'search_exact'
                    },
                    {
                        boxLabel   : 'Such-Fenster im Vordergrund halten',
                        name       : 'keep_front'
                    }
                ]
            };
        },
        
        buildGeneralOptionsFieldSet : function() {
            return {
                xtype       : 'fieldset',
                title       : 'Allgemeine Optionen',
                defaults    : { anchor : '100%' },
                items       : [
                    this.buildGeneralOptionsCheckboxGroup()
                ]
            };
        },

        buildOptionsFieldSet : function() {
            var sf_srv_cbg = {
                xtype      : 'checkboxgroup',
                columns    : 3,
                vertical   : true,
                flex       : 1,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Eigene',
                        name       : 'search_own'
                    },
                    {
                        boxLabel   : 'Genutzte',
                        name       : 'search_used'
                    },
                    {
                        boxLabel   : 'Nutzbare',
                        name       : 'search_visible',
                        checked    : false
                    }
                ]
            };

            return {
                // Fieldset with checkboxgroup to select
                // in which services should be searched.
                xtype       : 'fieldset',
                title       : 'In welchen Diensten suchen?',
                defaults    : { anchor : '100%' },
                items       : [
                    sf_srv_cbg
                ]
            };
        },

        buildIPSearchTab : function() {
            return {
                title : 'Ende-zu-Ende-Suche',
                items : [
                    this.buildIPSearchPanel()
                ]
            };
        },

        buildIPSearchPanel : function() {
            var cbg = {
                xtype      : 'checkboxgroup',
                columns    : 1,
                vertical   : true,
                flex       : 1,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Übergeordnete Netze einbeziehen',
                        name       : 'search_supernet'
                    },
                    {
                        boxLabel   : 'Enthaltene Netze einbeziehen',
                        name       : 'search_subnet'
                    }
                ]
            };
            var fieldset = {
                xtype       : 'fieldset',
                title       : 'Wonach soll gesucht werden?',
                defaults    : { anchor : '100%' },
                items       : [
                    {
                        xtype          : 'textfield',
                        id             : 'ip1',
                        name           : 'search_ip1',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 0 0',  // top,r,b,l
                        emptyText      : 'IP oder Zeichenkette',
                        loader         : {
                            url : 'html/ip_search_tooltip'
                        },
                        fieldLabel     : 'IP 1'
                    },
                    {
                        xtype          : 'textfield',
                        id             : 'ip2',
                        name           : 'search_ip2',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 0 0',  // top,r,b,l
                        emptyText      : 'IP oder Zeichenkette',
                        loader         : {
                            url : 'html/ip_search_tooltip'
                        },
                        fieldLabel     : 'IP 2'
                    },
                    {
                        xtype          : 'textfield',
                        name           : 'search_proto',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 10 0', // top,r,b,l
                        emptyText      : 'Protokoll oder Port',
                        loader         : {
                            url : 'html/ip_search_proto_tooltip'
                        },
                        fieldLabel     : 'Protokoll'
                    },
                    cbg
                ]
            };
            return fieldset;
        }
    }
);   
