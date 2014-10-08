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
    'PolicyWeb.view.Account',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.accountview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildAdminListPanel(),
                this.buildWatcherListPanel(),
                this.buildSupervisorListPanel(),
                this.buildSupervisorEmailsListpanel()
            ];
            
            this.callParent(arguments);
        },

        buildAdminListPanel : function() {
            var store = Ext.create(
                'PolicyWeb.store.Emails'
            );
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    id          : 'adminEmails',
                    title       : 'Verantwortliche',
                    store       : store,
                    border      : true
                }
            );
        },

        buildWatcherListPanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Watchers'
            );
        },

        buildSupervisorListPanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Supervisors'
            );
        },

        buildSupervisorEmailsListpanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.SupervisorEmails'
            );
        }
    }
);

