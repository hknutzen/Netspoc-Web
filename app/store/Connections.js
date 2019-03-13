

Ext.define(
    'PolicyWeb.store.Connections',
    {
        extend     : 'PolicyWeb.store.Netspoc',
        //extend     : 'Ext.data..Store',
        model      : 'PolicyWeb.model.Overview',
        groupField : 'res',
        autoLoad   : true,
        proxy      : {
            type   : 'memory',
            reader : {
                type         : 'json',
                rootProperty : 'records'
            }
        }
    }
);
