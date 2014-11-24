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
    'PolicyWeb.view.panel.grid.Emails',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.emaillist',
        controllers : [ 'Service', 'Account' ],
        store       : 'Emails',
        flex        : 1,
        border      : false,
        hideHeaders : true,
        title_prefix : 'Verantwortliche', // custom option
        split       : true,
        height      : 68,
        tools       : [
            {
                type    : 'print',
                scope   : this,
                callback : function ( panel ) {
                    panel.printview();
                }
            }
        ],
        columns     : [
            {
                dataIndex : 'email'
            }
        ],
        viewConfig : {
            selectedRowClass : 'x-grid3-row-over'
        },
        show : function(owner, alias) {
            if (! owner) {
                this.clear();
                return;
            }
            var store        = this.getStore();
            var active_owner = appstate.getOwner();
            var history      = appstate.getHistory();
            var lastOptions  = store.lastOptions;
            if ( lastOptions  &&
                 lastOptions.params  &&
                 lastOptions.params.owner === owner  &&
                 lastOptions.params.history === history  &&
                 lastOptions.params.active_owner === active_owner  &&
                 store.getCount() // Reload if data was removed previously.
               ) 
            {
                return;
            }
            store.load ({ params : { owner : owner } });
            this.setTitle(this.title_prefix + ' f&uuml;r ' + alias);
        },

        clear : function() {
            this.setTitle('');
            this.getStore().removeAll();
        }
    }
);

