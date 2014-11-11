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
    'PolicyWeb.view.window.About',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.aboutwindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Info über Policy-Web',
                    width       : 350,
                    height      : 500,
                    resizable   : false,
                    closeAction : 'hide',
                    items       : [
                        this.buildForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildForm : function () {
            var form = Ext.widget(
                {
                    xtype         : 'form',
                    bodyPadding   : 5,
                    width         : '100%',
                    fieldDefaults : {
                        labelAlign : 'left',
                        msgTarget  : 'top'
                    },
                    items : [
                        this.buildInfoPanel(),
                        this.buildThemeChooser()
                    ]
                }
            );
            return form;
	},
        
        buildInfoPanel : function() {
            var panel = {
                xtype     : 'panel',
                height    : 200,
                defaults  : {
                    bodyPadding : 10
                },
                items : [
                    {
                        xtype      : 'textfield',
                        name       : 'netspoc_version',
                        fieldLabel : 'Netspoc-Version',
                        allowBlank : false
                    },
                    {
                        xtype      : 'textfield',
                        name       : 'extjs_version',
                        fieldLabel : 'ExtJs-Version',
                        allowBlank : false
                    }
                ]
            };
            return panel;
        },

        buildThemeChooser : function() {

            function getQueryParam(name, queryString) {
                var match = RegExp(name + '=([^&]*)').exec(
                    queryString || location.search
                );
                return match && decodeURIComponent(match[1]);
            }
            
            function hasOption(opt) {
                var s = window.location.search;
                var re = new RegExp('(?:^|[&?])' + opt +
                                    '(?:[=]([^&]*))?(?:$|[&])', 'i');
                var m = re.exec(s);
                
                return m ? (m[1] === undefined ? true : m[1]) : false;
            }

            var scriptTags = document.getElementsByTagName('script'),
            defaultTheme = 'neptune',
            i = scriptTags.length,
            comboWidth = {
                classic         : 160,
                gray            : 160,
                neptune         : 180,
                crisp           : 180,
                'neptune-touch' : 220,
                'crisp-touch'   : 220
            },
            labelWidth = {
                classic         : 40,
                gray            : 40,
                neptune         : 45,
                crisp           : 45,
                'neptune-touch' : 55,
                'crisp-touch'   : 55
            },
            defaultQueryString, src, theme;

            while (i--) {
                src = scriptTags[i].src;
                if (src.indexOf('include-ext.js') !== -1) {
                    defaultQueryString = src.split('?')[1];
                    if (defaultQueryString) {
                        defaultTheme = getQueryParam('theme', defaultQueryString)
                            || defaultTheme;
                    }
                    break;
                }
            }
            
            Ext.themeName = theme = getQueryParam('theme') || defaultTheme;

            var theme_store = Ext.create(
                'Ext.data.Store', {
                    fields : ['value', 'name'],
                    data   : [
                        { value : 'neptune',       name: 'Neptune'       },
                        { value : 'neptune-touch', name: 'Neptune Touch' },
                        { value : 'crisp',         name: 'Crisp'         },
                        { value : 'crisp-touch',   name: 'Crisp Touch'   },
                        { value : 'classic',       name: 'Classic'       },
                        { value : 'gray',          name: 'Gray'          }
                    ]
                }
            );

            function setParam(param) {
                var queryString = Ext.Object.toQueryString(
                    Ext.apply(Ext.Object.fromQueryString(location.search), param)
                );
                location.search = queryString;
            }
            
            function removeParam(paramName) {
                var params = Ext.Object.fromQueryString(location.search);
                
                delete params[paramName];
                
                location.search = Ext.Object.toQueryString(params);
            }

            var combo = Ext.create(
                'Ext.form.ComboBox',
                {
                    width        : comboWidth[Ext.themeName],
                    labelWidth   : labelWidth[Ext.themeName],
                    fieldLabel   : 'Theme auswählen',
                    displayField : 'name',
                    valueField   : 'value',
                    labelStyle   : 'cursor:move;',
                    margin       : '0 5 0 0',
                    store        : theme_store,
                    value        : theme,
                    listeners    : {
                        select : function(combo) {
                            var theme = combo.getValue();
                            if (theme !== defaultTheme) {
                                setParam({ theme: theme });
                            } else {
                                removeParam('theme');
                            }
                        }
                    }
                }
            );
            var panel = {
                xtype     : 'panel',
                height    : 200,
                defaults  : {
                    bodyPadding : 10
                },
                items : [
                    combo
                ]
            };
            return combo;
        }
    }
);