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
    'PolicyWeb.view.panel.grid.AllServices',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.allservices',
        controllers : [ 'Service' ],
        store       : 'AllServices',
        forceFit    : true,
        border      : false,
        features    : [
            {
                groupHeaderTpl    : 'Dienst: {name} ({[values.children.length]} Regel{[(values.children.length) > 1 ? "n" : ""]})',
                ftype             : 'grouping',
                hideGroupedHeader : true
            }
        ],
        columns     : {
            items : [
                { text            : 'Dienstname',
                  dataIndex       : 'service'
                },
                { text : 'Aktion',     dataIndex : 'action', flex : 1 },
                { text : 'Quelle',     dataIndex : 'src'     },
                { text : 'Ziel',       dataIndex : 'dst'     },
                { text : 'Protokoll',  dataIndex : 'proto'   }
            ],
            defaults : {
                flex         : 2,
                menuDisabled : true
            }
        },
        tbar : [ { xtype : 'printbutton' } ]
    }
);

