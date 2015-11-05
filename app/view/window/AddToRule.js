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
    'PolicyWeb.view.window.AddToRule',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.addtorulewindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Objekt zu Regel hinzufügen',
                    width       : 500,
                    height      : 354,
                    resizable   : false,
                    items       : [
                        this.buildAddToRuleForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildAddToRuleForm : function () {
            var form = Ext.widget(
                {
                    xtype       : 'form',
                    method      : 'POST',
                    jsonSubmit  : true,
                    url         : 'backend/add_object_to_rule',
                    buttonAlign : 'center',
                    bodyPadding : 5,
                    width       : '100%',
                    items       : [
                        this.buildInfoTextPanel(),
                        this.buildFieldset(),
                        {
                            xtype : 'button',
                            text  : 'Auftrag per Mail senden',
                            width : '100%'
                        }
                    ]
                }
            );
            return form;
	},

        buildFieldset : function () {
            var fieldset = 
                {
                    xtype       : 'fieldset',
                    title       : 'Name und IP-Adresse',
                    defaultType : 'textfield',
                    defaults    : {anchor: '100%'},
                    layout      : 'anchor',
                    items       : [
                        this.createRadioGroup(),
                        this.createTextField(),
                        this.createGridPanel()
                    ]
                };
            return fieldset;
        },

        createRadioGroup : function() {
            return {
                xtype      : 'radiogroup',
                fieldLabel : 'Hinzufügen zu',
                columns    : 1,
                vertical   : true,
                items      : [
                    { boxLabel : 'Quelle',    name : 'rb', inputValue : 'Quelle'},
                    { boxLabel : 'Ziel',      name : 'rb', inputValue : 'Ziel' },
                    { boxLabel : 'Protokoll', name : 'rb',
                      inputValue : 'Protokoll', checked : true }
                ]
            };
        },

        createTextField : function() {
            return {
                fieldLabel : 'Hinzufügen',
                name       : 'object2add_to_rule',
                allowBlank : false
            };
        },

        createGridPanel : function() {
            // Important: We have to create a new store here, so that the
            // grid displaying the original rules stays untouched!
            var store = Ext.create('PolicyWeb.store.Rules');
            var grid = Ext.create(
                'PolicyWeb.view.panel.grid.Rules',
                {
                    xtype  : 'servicerules',
                    store  : store,
                    height : 100,
                    layout : 'fit'
                }
            );
            return grid;
        },

        buildInfoTextPanel : function() {
            return Ext.create( 'PolicyWeb.view.container.TaskEmailInfo' );
        }
    }
);   
