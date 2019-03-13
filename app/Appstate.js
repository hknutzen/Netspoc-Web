/*
Global application state. Fires events on changes.

(C) 2014 by Heinz Knutzen     <heinz.knutzen@gmail.com>
            Daniel Brunkhorst <daniel.brunkhorst@web.de>

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

var appstate = (
    function () {
        var owner       = '';
        var history     = '';
        var networks    = '';
        var init_phase  = true;
        var admin       = false;
        var state = Ext.create( 'Ext.util.Observable' );

        state.setAdmin = function ( bool ) {
            admin = bool;
        };
        state.isAdmin = function ( bool ) {
            return admin;
        };
        state.setInitPhase = function ( bool ) {
            init_phase = bool;
        };
        state.getInitPhase = function () {
            return init_phase;
        };
        state.changeOwner = function (name, silent) {
            if (name !== owner) {
                owner = name;
                if (! silent) {
                    state.fireEvent('changed');
                    state.fireEvent('ownerChanged');
                }
            }
        };
        state.changeHistory = function (record, silent) {
            var data = { policy  : record.get('policy'),
                         date    : record.get('date'),
                         time    : record.get('time'),
                         current : record.get('current') };
            if (! history || 
                data.policy !== history.policy) 
            {
                history = data;
                if (! silent) {
                    state.fireEvent('changed');
                    state.fireEvent('historyChanged');
                }
            }
        };
        state.changeNetworks = function ( chosen_networks, silent) {
            if ( chosen_networks !== networks ) {
                networks = chosen_networks;
                if ( ! silent ) {
                    state.fireEvent('changed');
                    state.fireEvent('networksChanged');
                }
            }
        };
        state.getOwner = function () {
            return owner;
        };
        state.getPolicy = function () {
            return history.policy;
        };
        state.getHistory = function () {
            if (history.current) {
                return history.policy;
            }
            else {
                return history.date;
            }
        };
        state.getNetworks = function () {
            return networks;
        };
        state.showHistory = function () {
            var now = new Date();

            // history.date: 'yyyy-mm-dd'
            var ymd = history.date.split('-');
            
            // month for 'new Date' is counted from 0.
            var pdate = new Date(ymd[0], ymd[1]-1, ymd[2]);
            var when = (Ext.Date.getDayOfYear(now) === Ext.Date.getDayOfYear(pdate)) ?
                history.time : history.date;
            var version = history.current ? 'aktuell' : history.policy;
            return (when + ' (' + version + ')');
        };
        return state;
    }()
);
