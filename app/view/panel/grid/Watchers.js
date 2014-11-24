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
    'PolicyWeb.view.panel.grid.Watchers',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.watcherlist',
        controllers : [ 'Account' ],
        store       : 'Watchers',
        border      : true,
        hideHeaders : true,
        flex        : 1,
        title       : 'Zuschauer (Watcher)',
        tools       : [
            {
                type    : 'print',
                scope   : this,
                callback : function ( panel ) {
                    panel.printview();
                }
            }
        ],
        columns     : {
            items : [
                { dataIndex : 'email'    }
            ]
        }
    }
);

