

Ext.define(
    'PolicyWeb.store.Policy',
    {
        extend   : 'Ext.data.Store',
        requires : 'PolicyWeb.model.Policy',
        model    : 'PolicyWeb.model.Policy',
        autoLoad : true
    }
);
