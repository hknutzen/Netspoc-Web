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
    'PolicyWeb.view.window.DeleteFromRule',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.delfromrulewindow',

        initComponent : function() {
            Ext.apply(
                this,
                {
                    title       : 'Quelle/Ziel/Protokoll aus Regel entfernen',
                    width       : 500, 
                    height      : 254,
                    resizable   : false,
                    items       : [
                        this.buildDeleteUserForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildDeleteUserForm : function () {
            var datatip = new Ext.ux.DataTip();
            var form = Ext.widget(
                {
                    xtype       : 'form',
/*
                    method      : 'POST',
                    jsonSubmit  : true,
                    url         : 'backend/remove_object_from_rule',
*/
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
                    title       : 'Zu entfernendes Objekt auswählen',
                    defaults    : {anchor: '100%'},
                    layout      : 'anchor',
                    items       : [
                        this.createRadioGroup(),
                        this.createComboBox()
                    ]
                };
            return fieldset;
        },

        createComboBox : function() {
            return {
                xtype        : 'combo',
                displayField : 'item',
                valueField   : 'item',
                queryMode    : 'local',
                allowBlank   : false
            };
        },

        createRadioGroup : function() {
            return {
                xtype      : 'radiogroup',
                fieldLabel : 'Entfernen aus',
                columns    : 1,
                vertical   : true,
                items      : [
                    { boxLabel : 'Quelle',    name : 'rb', inputValue : 'Quelle'    },
                    { boxLabel : 'Ziel',      name : 'rb', inputValue : 'Ziel'      },
                    { boxLabel : 'Protokoll', name : 'rb', inputValue : 'Protokoll' }
                ]
            };
        },

        buildInfoTextPanel : function() {
            return Ext.create( 'PolicyWeb.view.container.TaskEmailInfo' );
        }
    }
);   
