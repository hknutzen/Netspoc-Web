
Ext.define(
    'PolicyWeb.model.OverviewOwnResource',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            {
                name     : 'resource',
                sortType : 'asIP'
            }
        ]
    }
);
