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
    'PolicyWeb.view.window.AddUser',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.adduserwindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Objekt zu Benutzern("User") hinzufügen',
                    width       : 500, 
                    height      : 223,
                    resizable   : false,
                    items       : [
                        this.buildAddUserForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildAddUserForm : function () {
            var datatip = new Ext.ux.DataTip();
            var form = Ext.widget(
                {
                    xtype       : 'form',
                    plugins     : datatip,
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
                        {
                            fieldLabel : 'IP-Adresse (erforderlich)',
                            name       : 'add_user_ip',
                            allowBlank : false,
                            vtype      : 'IPAddress'
                        },
                        {
                            fieldLabel : 'Name (optional)',
                            name       : 'add_user_string',
                            labelWidth : 100
                        }
                    ]
                };
            return fieldset;
        },

        buildInfoTextPanel : function() {
            return Ext.create( 'PolicyWeb.view.container.TaskEmailInfo' );
        }
    }
);   
