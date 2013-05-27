
// Main file that launches application.
Ext.Loader.setConfig(
    {
        enabled        : true,
        paths          : {
            'PolicyWeb' : './app'
        }
        //disableCaching : false
    }
);

Ext.require( [
                 'PolicyWeb.proxy.Custom',
                 'PolicyWeb.store.Service',
                 'PolicyWeb.store.Netspoc',
                 'PolicyWeb.store.NetspocState',
                 'PolicyWeb.store.History',
                 'PolicyWeb.store.Owner',
                 'PolicyWeb.store.AllOwners',
                 'PolicyWeb.store.Policies',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.OwnerCombo',
                 'PolicyWeb.view.HistoryCombo',
                 'PolicyWeb.view.Service',
                 'PolicyWeb.view.panel.CardPrintActive',
                 'PolicyWeb.view.panel.form.ServiceDetails',
                 'PolicyWeb.view.button.PrintButton'
             ]
           );

Ext.application(
    {
	name               : 'PolicyWeb',
        appFolder          : './app',
	autoCreateViewport : true,
	models             : [ 'Netspoc', 'Service', 'Owner' ],
	stores             : [ 'Netspoc', 'NetspocState', 'Service',
                               'Owner', 'AllOwners', 'History', 'Policies' ],
	controllers        : [ 'Main', 'Service' ],
	launch             : function() {
        }
    }
);

