
Ext.define(
    'PolicyWeb.model.Base', {
        extend: 'Ext.data.Model',
        
        fields : [
            {
                name : 'name',
                type : 'string'
            }
        ],
        
        schema: {
            namespace : 'PolicyWeb.model',  // generate auto entityName
            
            proxy     : {     // Ext.util.ObjectTemplate
                type          : 'ajax',
                noCache       : false,
                extraParams   : {},
                pageParam     : '',
                limitParam    : '',
                startParam    : '',
                actionMethods : { read : 'POST' },
                reader        : {
                    type         : 'json',
                    rootProperty : 'records'
                },
                url           : '/index.html'
            }
        }
    }
);