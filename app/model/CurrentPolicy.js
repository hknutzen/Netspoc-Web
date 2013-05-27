
Ext.define(
    'PolicyWeb.model.CurrentPolicy',
    {
        extend : 'Ext.data.Model',
        fields : [
            { name : 'policy'  },
            { name : 'date'    },
            { name : 'time'    },
            { name : 'current' }
        ]
    }
);

