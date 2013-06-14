
Ext.define(
    'PolicyWeb.view.panel.grid.Users',
    {
        extend      : 'PolicyWeb.view.panel.grid.Abstract',
        alias       : 'widget.serviceusers',
        controllers : [ 'Service' ],
        store       : 'Users',
        forceFit    : true,
        flex        : 2,
        border      : false,
        columns     : [
            {
                header    : 'Name',
                dataIndex : 'name',
                flex      : 4,
                fixed     : true
            },
            {
                header    : 'IP-Adressen',
                flex      : 2,
                dataIndex : 'ip'
            },
            {
                header    : 'Verantwortungsbereich',
                flex      : 2,
                dataIndex : 'owner'
            }
        ]
    }
);


