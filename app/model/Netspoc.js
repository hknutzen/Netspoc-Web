
Ext.define(
    'PolicyWeb.model.Netspoc', {
        extend : 'Ext.data.Model',
        proxy  : {
            type       : 'ajax',
            pageParam  : false, //to remove param "page"
            startParam : false, //to remove param "start"
            limitParam : false, //to remove param "limit"
            noCache    : false, //to remove param "_dc<xyz>"
            reader : {
                type            : 'json',
                root            : 'records',
                totalProperty   : 'totalCount',
                successProperty : 'success'
            }
        }
    }
);