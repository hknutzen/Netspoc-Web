var Harness = Siesta.Harness.Browser.ExtJS;

Harness.configure({
    title           : 'MVC Test Suite',
    waitForAppReady : true,
    debuggerOnFail  : true,
    testClass       : PolicyWeb.TestClass,
    loaderPath      : {
        'PolicyWeb' : './app',
        'Ext.ux'    : './resources/ux'

    },
    
    preload : [
        "/extjs4/resources/css/ext-all.css",
        "/extjs4/ext-all-debug.js",
	"app/common.js",
	"app/Appstate.js"
    ]
    
});

Harness.start(
    {
        group               : 'Sanity',
        items               : [
            't/frontend/sanity/sanity.t.js',
            't/frontend/sanity/login.t.js'
        ]
    },
    {
        group               : 'Model',
        items               : [
            't/frontend/model/allowners_model.t.js'
        ]
    },
    {
        group               : 'Views',
        items               : [
            't/frontend/view/network_view.t.js'
        ]
    },
    {
        group               : 'Application',
        
        // need to set the `preload` to empty array - to avoid the double loading of dependencies
        preload             : [],
        
        items : [
            {
                //hostPageUrl         : 'app.html',
                url                 : 't/frontend/application/app.t.js'
            }
        ]
    }
);

