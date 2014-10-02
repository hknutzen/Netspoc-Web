var Harness = Siesta.Harness.Browser.ExtJS;

Harness.configure({
    title       : 'MVC Test Suite',
    loaderPath  : {
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
            't/frontend/010_sanity.t.js'
        ]
    },
    {
        group               : 'Model',
        items               : [
            't/frontend/020_allowners_model.t.js'
        ]
    },
    {
        group               : 'Views',
        items               : [
            't/frontend/050_network_view.t.js'
            //'t/frontend/051_service_view.t.js'
        ]
    },
    {
        group               : 'Application',
        
        // need to set the `preload` to empty array - to avoid the double loading of dependencies
        preload             : [],
        
        items : [
            {
                hostPageUrl         : 'app.html',
                url                 : 't/frontend/100_app.t.js'
            }
        ]
    }
);

