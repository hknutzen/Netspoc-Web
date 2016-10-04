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
    'PolicyWeb.view.window.CompatInfo',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.compatinfowindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Kompatibilitätsmodus erkannt',
                    width       : 500, 
                    height      : 218,
                    resizable   : false,
                    items       : [
                        this.buildInfoTextPanel(),
                        this.buildForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildInfoTextPanel : function() {
            return Ext.create( 'PolicyWeb.view.container.CompatInfo' );
        },

        buildForm : function () {
            var form = Ext.create(
                'Ext.form.Panel', {
                    bodyPadding : 10,
                    layout      : 'fit',
                    border      : false,
                    items       : [
                        {
                            xtype       : 'fieldcontainer',
                            defaultType : 'checkboxfield',
                            items       : [
                                {
                                    boxLabel  : 'Ich habe die möglichen Einschränkungen zur Kenntnis genommen. Diesen Hinweis bitte nicht mehr anzeigen!'
                                }
                            ]
                        }
                    ],
                    bbar : [
                        {
                            text    : 'Ok',
                            align   : 'center'
                        }
                    ]
                }
            );
            return form;
	}
    }
);   
