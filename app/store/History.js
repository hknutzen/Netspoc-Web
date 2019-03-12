

Ext.define(
    'PolicyWeb.store.History',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.History',
        autoLoad : false,
        needLoad : true // own config param, not ExtJs
    }
);
