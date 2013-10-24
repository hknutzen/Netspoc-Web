
Ext.define(
    'PolicyWeb.view.Policy',
    {
        extend     : 'Ext.grid.Panel',
        alias      : 'widget.policygrid',
        title      : 'Policy Grid',
        frame      : false,
        viewConfig : {
            forceFit : true
        },
        store      : 'Policy',
        columns    : [
            { text: 'Name',  dataIndex: 'name' }
        ]
    }
);

