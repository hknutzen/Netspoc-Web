
Ext.define(
    'PolicyWeb.store.Netspoc', {
        extend      : 'Ext.data.Store',
        model       : 'PolicyWeb.model.Netspoc',
        alias       : 'store.netspocstore',
        autoLoad    : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'netspoc_override_me'
        },
        constructor : function() {
            this.callParent( arguments );

            this.addListener('beforeload', function ( store, options ) {
                                 Ext.getBody().mask('Daten werden geladen ...', 
                                                    'x-mask-loading');
                                 return true;                   
                             }
                            );
            this.addListener('load', function() { 
                                 Ext.getBody().unmask();
                                 this.isLoaded = true;
                             }
                            );
        }
    }
);

