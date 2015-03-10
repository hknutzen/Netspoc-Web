Class(
    'PolicyWeb.TestClass',
    {
        isa         : Siesta.Test.Browser,
        
        override : {
            
            setup : function (callback, errback) {
                Ext.Ajax.request(
                    {
                        url     : 'backend/login',
                        params  : { email : 'guest', app : '../app.html' },
                        
                        success : function () {
                            callback();
                        },
                        failure : function () {
                            errback('Login failed');
                        }
                    }
                );
            }
        }
    }
);
