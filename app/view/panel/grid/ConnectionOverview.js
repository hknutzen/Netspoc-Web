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
    'PolicyWeb.view.panel.grid.ConnectionOverview',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.connectionoverview',
        controllers : [ 'Service' ],
        store       : 'Connections',
        forceFit    : true,
        border      : false,
        features    : [
            {
                groupHeaderTpl    : 'Ausgewählte Resource : {name}  ({[values.children.length]} Verbindung{[(values.children.length) > 1 ? "en" : ""]})',
                ftype             : 'grouping',
                hideGroupedHeader : true
            }
        ],
        columns     : [
            {                        dataIndex : 'res'            },
            { header : 'Ist',        dataIndex : 'what', flex : 1 },
            { header : 'Quelle',     dataIndex : 'src',  flex : 7 },
            { header : 'Ziel',       dataIndex : 'dst',  flex : 7 },
            { header : 'Protokolle', dataIndex : 'prt',  flex : 7 }
        ],
        tbar : [
            { xtype : 'printbutton' }
        ],
        defaults : {
            flex         : 2,
            menuDisabled : true
        }
    }
);

