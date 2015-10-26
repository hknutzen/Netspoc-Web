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
    'PolicyWeb.view.window.DeleteUser',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.deluserwindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Objekt von Benutzern("User") entfernen',
                    width       : 500, 
                    height      : 182,
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
            var store = Ext.create(
                'PolicyWeb.store.ServiceUsers'
            );
            var fieldset = 
                {
                    xtype       : 'fieldset',
                    title       : 'Zu entfernendes Objekt auswählen',
                    defaultType : 'combo',
                    defaults    : {anchor: '100%'},
                    layout      : 'anchor',
                    items       : [
                        {
                            displayField : 'name',
                            valueField   : 'name',
                            store        : store
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
