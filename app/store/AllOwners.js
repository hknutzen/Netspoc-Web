

Ext.define(
    'PolicyWeb.store.AllOwners',
    {
        //extend   : 'Ext.data.Store',
        extend   : 'PolicyWeb.store.Netspoc',
        model    : 'PolicyWeb.model.AllOwners',
        autoLoad : true,
     proxy: {
         type: 'ajax',
         url: 'backend/get_owners',
         reader: {
             type: 'json',
             rootProperty: 'records'
         }
     }
/*
        proxy    : {
            type          : 'policyweb',
            proxyurl      : 'get_owners'
        }
*/
    }
);
