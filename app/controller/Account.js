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
    'PolicyWeb.controller.Account', {
        extend : 'Ext.app.Controller',
        stores : [ 'Watchers', 'Emails', 'Supervisors', 'SupervisorEmails' ],
        refs   : [
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'
            },
            {
                selector : 'watcherlist',
                ref      : 'watchersGrid'
            },
            {
                selector : 'supervisorlist',
                ref      : 'supervisorsGrid'
            },
            {
                selector : 'supervisoremaillist',
                ref      : 'supervisorEmailGrid'
            },
            {
                selector : '#adminEmails',
                ref      : 'adminEmailList'
            }
        ],

        init : function() {
            this.control(
                {
                    'accountview' : {
                        beforeactivate : this.onBeforeActivate
                    },
                    'accountview supervisorlist' : {
                        select : this.onSupervisorSelected
                    }
                }
            );
        },

        onLaunch : function () {
            var store = this.getSupervisorsStore();
            store.on( 'load',
                      function () {
                          this.getSupervisorsGrid().select0();
                      },
                      this
                    );
            appstate.addListener(
                'changed', 
                function () {
                    if ( appstate.getInitPhase() ) { return; }
                    var cardpanel = this.getMainCardPanel();
                    var index = cardpanel.getLayout().getActiveItemIndex();
                    if ( index === 3 ) {
                        this.onBeforeActivate();
                    }
                },
                this
            );
        },
        
        onBeforeActivate : function ( new_card, old_card ) {
            this.getAdminEmailList().getStore().load();
            this.getWatchersStore().load();
            this.getSupervisorEmailGrid().clear();
            this.getSupervisorsStore().load();
        },
        
        onSupervisorSelected : function( rowmodel, supervisor, index, eOpts ) {
            var email_panel = this.getSupervisorEmailGrid();
            if ( supervisor ) {
                email_panel.show( supervisor.get('name') );
            }
            return true;
        }
    }
);
