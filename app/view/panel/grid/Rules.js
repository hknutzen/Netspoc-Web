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
    'PolicyWeb.view.panel.grid.Rules',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.servicerules',
        controllers : [ 'Service' ],
        store       : 'Rules',
        forceFit    : true,
        flex        : 2,
        border      : false,
        columns     : [
            {
                header    : 'Aktion',
                dataIndex : 'action',
                flex      : 2,
                fixed     : true
            },
            {
                header    : 'Quelle',
                flex      : 5,
                dataIndex : 'src'
            },
            {
                header    : 'Ziel',
                flex      : 5,
                dataIndex : 'dst'
            },
            {
                header    : 'Protokoll',
                flex      : 2,
                dataIndex : 'prt'
            },
            {
                xtype : 'actioncolumn',
                width : 36,
                items : [
                    {
                        icon    : '/silk-icons/add.png',
                        tooltip : 'Objekt zu Regel hinzufügen',
                        handler: function(view, rowIndex, colIndex, item, e, record, row) {
                            this.fireEvent('addobjecttorule', view, rowIndex, colIndex, item, e, record, row, 'add');
                        }
                    },
                    {
                        icon    : '/silk-icons/delete.png',
                        tooltip : 'Objekt aus Regel entfernen',
                        handler: function(view, rowIndex, colIndex, item, e, record, row) {
                            this.fireEvent('deleteobjectfromrule', view, rowIndex, colIndex, item, e, record, row, 'delete');
                        }
                    }
                ]
            }
        ],
        defaults : {
            menuDisabled : true
        }
    }
);

