
Ext.define(
    'PolicyWeb.model.History',
    {
        extend : 'Ext.data.Model',
        fields : [ 'policy', 'date', 'time', 'current' ],
        fields : [
            { name : 'policy'  },
            { name : 'date'    },
            { name : 'time'    },
            { name : 'current' }
        ],

        proxy: {
            type : 'ajax',
            url  : 'backend/get_history',
            reader : {
                root            : 'records',
                successProperty : 'success',
                totalProperty   : 'totalCount'
            }
        }        
    }
);

