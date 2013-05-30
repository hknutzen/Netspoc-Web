
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
                 'PolicyWeb.store.Rules',
                 'PolicyWeb.store.Users',
                 'PolicyWeb.store.Emails',
                 'PolicyWeb.store.Netspoc',
                 'PolicyWeb.store.NetspocState',
                 'PolicyWeb.store.History',
                 'PolicyWeb.store.Owner',
                 'PolicyWeb.store.AllOwners',
                 'PolicyWeb.store.CurrentPolicy',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.OwnerCombo',
                 'PolicyWeb.view.HistoryCombo',
                 'PolicyWeb.view.Service',
                 'PolicyWeb.view.panel.grid.Services',
                 'PolicyWeb.view.panel.grid.Users',
                 'PolicyWeb.view.panel.grid.Rules',
                 'PolicyWeb.view.panel.grid.Emails',
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
	models             : [ 'Netspoc', 'Service', 'Rule', 'Owner' ],
	stores             : [ 'Netspoc', 'NetspocState', 'Service',
                               'Rules', 'Users', 'Emails', 'Owner',
                               'AllOwners', 'History',
                               'CurrentPolicy' ],
	controllers        : [ 'Main', 'Service' ],
	launch             : function() {
        }
    }
);

