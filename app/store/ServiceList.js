

Ext.define(
    'PolicyWeb.store.ServiceList',
    {
        //extend   : 'Ext.data.Store',
        extend      : 'PolicyWeb.store.NetspocState',
        model       : 'PolicyWeb.model.ServiceList',
        controllers : [ 'Service' ],
        autoLoad    : false,
        constructor : function( config ) {
            config = config || {};
            if ( config.proxyurl ) {
                alert( 'proxyurl should not be passed as param!' );
            }
            config.proxyurl = 'get_services';
            // call the superclass's constructor
            this.callParent( config );
        }
    }
);
