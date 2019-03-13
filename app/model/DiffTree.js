
Ext.define(
    'PolicyWeb.model.DiffTree',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name : 'text',    type : 'string'  },
            { name : 'iconCls', type : 'string'  },
            { name : 'leaf',    type : 'boolean', persist: false }
        ],

        proxy : {     // Ext.util.ObjectTemplate
            type          : 'ajax',
            reader        : {
                type         : 'json',
                rootProperty : 'children'
            },
            url           : 'backend/get_diff'
        }
    }
);

