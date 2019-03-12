

Ext.define(
    'PolicyWeb.store.Service',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        //extend     : 'Ext.data.Store',
        model    : 'PolicyWeb.model.Service',
        autoLoad : false,
        sorters  : [
            {
                property  : 'name',
                direction : 'ASC'
            }
        ]
    }
);
