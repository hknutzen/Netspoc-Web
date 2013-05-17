
Ext.define(
    'PolicyWeb.model.ServiceList',
    {
        extend : 'PolicyWeb.model.Netspoc',
        //extend : 'Ext.data.Model',
        fields : [
            { name     : 'name', 
              sortType : 'asUCString' 
            },
            { name : 'desc',  mapping : 'description' },
            { name : 'owner' },
            { name : 'sub_owner' }
        ],
        proxy  : {
            type       : 'ajax',
            url        : 'backend/service_list',
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

