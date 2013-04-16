
// Main file that launches application.

Ext.Loader.setConfig(
    {
        disableCaching : false
    }
);


Ext.application(
    {
	name               : 'PolicyWeb',
        appFolder          : './app',
	autoCreateViewport : true,
	models             : [ 'Policy', 'Netspoc' ],
	stores             : [ 'Policy', 'Netspoc' ],
	controllers        : [  ],
	launch             : function() {
        }
    }
);

