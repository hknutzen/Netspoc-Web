
Ext.define(
    'PolicyWeb.store.NetspocState', {
        extend      : 'PolicyWeb.store.Netspoc',
        alias       : 'store.netspocstatestore',
        constructor : function() {

            // Call constructor of superclass.
            this.callParent();

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
            console.log( 'CHANGEBASEPARAMS' );
            this.getProxy().extraParams.active_owner    = appstate.getOwner();
            this.getProxy().extraParams.history         = appstate.getHistory();
            this.getProxy().extraParams.chosen_networks = appstate.getNetworks();
        }
    }
);

/*
Ext.define(
    'PolicyWeb.store.NetspocGroup', {
        extend      : 'Ext.data.JsonStore',
        constructor : (getConstructor(Ext.data.JsonStore)),
        alias       : 'store.netspocgroupstore'
    }
);

Ext.define(
    'PolicyWeb.store.NetspocGroupState', {
        extend      : 'PolicyWeb.store.NetspocGroup',
        constructor : (getStateConstructor(PolicyWeb.store.NetspocGroup)),
        alias       : 'store.groupingstatestore'
    }
);
*/
