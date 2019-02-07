

Ext.define(
    'PolicyWeb.store.NetworkResources',
    {
        extend     : 'PolicyWeb.store.NetspocState',
        model      : 'PolicyWeb.model.NetworkResources',
        autoLoad   : false,
        groupField : 'name',
        sorters    : [
            {
                property  : 'ip',
                direction : 'ASC'
            }
        ]
    }
);
