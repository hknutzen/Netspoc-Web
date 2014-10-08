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
    'PolicyWeb.store.NetspocState', {
        extend      : 'PolicyWeb.store.Netspoc',
        alias       : 'store.netspocstatestore',
        constructor : function() {
            // Call constructor of superclass.
            this.callParent(arguments);

            // Set baseParams and reload store if appstate changes.
            this.changeBaseParams();
            appstate.addListener(
                'changed', 
                function () {
                    this.changeBaseParams();
                    if (this.doReload && this.isLoaded) {
                        // Update copy of baseParams stored in lastOptions.
                        Ext.apply(this.lastOptions.params, this.baseParams);
                        this.reload();
                    }
                }, this);
        },
        changeBaseParams : function() {
            //console.log( 'CHANGE BASE PARAMS' );
            this.getProxy().extraParams.active_owner    = appstate.getOwner();
            this.getProxy().extraParams.history         = appstate.getHistory();
            this.getProxy().extraParams.chosen_networks = appstate.getNetworks();
        }
    }
);

