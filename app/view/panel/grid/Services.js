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
    'PolicyWeb.view.panel.grid.Services',
    {
        id          : 'pnl_services',
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.servicelist',
        controllers : [ 'Service' ],
        store       : 'Service',
        border      : false,
        width       : 310,
        columns     : {
            items : [
                { text : 'Dienstname',  dataIndex : 'name' }
            ],
            defaults : {
                flex         : 1,
                menuDisabled : true
            }
        },
        tbar        : [
            {
                id           : 'btn_own_services',
                xtype        : 'chooseservice',
                text         : 'Eigene',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'owner'
            },
            {   
                id           : 'btn_used_services',
                xtype        : 'chooseservice',
                text         : 'Genutzte',
                toggleGroup  : 'polNavBtnGrp',
                pressed      : true,
                enableToggle : true,
                relation     : 'user'
            },
            {
                id           : 'btn_usable_services',
                xtype        : 'chooseservice',
                text         : 'Nutzbare',
                toggleGroup  : 'polNavBtnGrp',
                enableToggle : true,
                relation     : 'visible'
            },
            {   
                id           : 'btn_search_services',
                text         : 'Suche',
                enableToggle : false,
                allowDepress : false
            },
            '->',
/*
            {
                iconCls  : 'icon-map'
            },
*/
            {
                id    : 'btn_services_print_all',
                xtype : 'print-all-button'
            },
            {
                id    : 'btn_services_print',
                xtype : 'printbutton'
            }
        ]
    }
);

