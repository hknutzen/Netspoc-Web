
var appstate = (
    function () {
        var owner       = '';
        var owner_alias = '';
        var history     = '';
        var networks    = '';
        var state = Ext.create( 'Ext.util.Observable' );
        state.addEvents('changed', 'ownerChanged',
                        'historyChanged', 'networksChanged');
        state.changeOwner = function (name, alias, silent) {
            owner_alias = alias;
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
        state.getOwnerAlias = function () {
            return owner_alias;
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
