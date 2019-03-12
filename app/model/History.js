
Ext.define(
    'PolicyWeb.model.History',
    {
        extend : 'Ext.data.Model',
        fields : [
            { name : 'policy'  },
            { name : 'date'    },
            { name : 'time'    },
            { name : 'current' }
        ],
        proxy  : {
            url : 'backend/get_history'
        }
    }
);

