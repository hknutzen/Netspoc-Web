
Ext.define(
    'PolicyWeb.proxy.Custom', { 
        alias       : 'proxy.policyweb', 
        extend      : 'Ext.data.proxy.Ajax', 
        pageParam   : false, //to remove param "page"
        startParam  : false, //to remove param "start"
        limitParam  : false, //to remove param "limit"
        noCache     : true,  //allow param "_dc<xyz>" to disable caching

        constructor : function() { 
            this.reader = { 
                type            : 'json',
                root            : 'records',
                totalProperty   : 'totalCount',
                successProperty : 'success'
            }; 
            
            this.callParent(arguments); 
        },
        
        buildUrl    : function (request) {
            var url = '';
            if ( this.proxyurl ) {
                url = 'backend/' + this.proxyurl;
            }
            else {
                alert( 'Error: No proxyurl configured!' );
            }
            return url;
        }
    }
);
