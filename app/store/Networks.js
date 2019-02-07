

Ext.define(
    'PolicyWeb.store.Networks',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Network',
        autoLoad : false,
        sorters  : [
            {
                property  : 'ip',
                direction : 'ASC'
            }
        ]
    }
);
