

Ext.define(
    'PolicyWeb.store.AllServices',
    {
        extend     : 'PolicyWeb.store.NetspocState',
        model      : 'PolicyWeb.model.AllService',
        autoLoad   : false,
        groupers   : [
            {
                property  : 'service',
                sorterFn  : function(o1, o2) {
                    var v1 = germanize( o1.data.service.toUpperCase() );
                    var v2 = germanize( o2.data.service.toUpperCase() );
                    return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
                },
                direction : 'ASC'
            }
        ]
    }
);
