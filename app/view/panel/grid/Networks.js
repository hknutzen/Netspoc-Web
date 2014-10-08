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
    'PolicyWeb.view.panel.grid.Networks',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.networklist',
        controllers : [ 'Network' ],
        store       : 'Networks',
        forceFit    : true,
        flex        : 2,
        border      : false,
        viewConfig  : {
            loadMask : false
        },
        columns     : [
            { text : 'IP-Adresse',            dataIndex : 'ip'    },
            { text : 'Name',                  dataIndex : 'name'  },
            { text : 'Verantwortungsbereich', dataIndex : 'owner' }
        ],
        buildSelModel : function() {
            return {
                selType            : 'checkboxmodel',
                mode               : 'MULTI',
                showHeaderCheckbox : false,
                headerWidth        : 24
            };
        }
    }
);

