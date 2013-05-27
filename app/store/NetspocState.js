
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

