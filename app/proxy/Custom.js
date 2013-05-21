
Ext.define(
    'PolicyWeb.proxy.Custom', { 
        alias       : 'proxy.policyweb', 
        extend      : 'Ext.data.proxy.Ajax', 
        pageParam   : false, //to remove param "page"
        startParam  : false, //to remove param "start"
        limitParam  : false, //to remove param "limit"
        noCache     : false, //to remove param "_dc<xyz>"

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
            var url = 'backend/' + this.proxyurl;
            if ( this.proxyurl ) {
                //console.log( 'Set proxy url to ' + url );
                return url;
            }
            else {
                console.log( 'NO PROXYURL CONFIGURED!' );
            }
        }
    }
);