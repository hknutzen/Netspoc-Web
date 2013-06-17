
// Main file that launches application.
Ext.Loader.setConfig(
    {
        enabled        : true,
        paths          : {
            'PolicyWeb' : './app',
            'Ext.ux'    : './resources/ux'
        }
        //disableCaching : false
    }
);

Ext.require( [
                 'Ext.ux.grid.Printer',
                 'PolicyWeb.proxy.Custom',
                 'PolicyWeb.store.Service',
                 'PolicyWeb.store.Networks',
                 'PolicyWeb.store.NetworkResources',
                 'PolicyWeb.store.Rules',
                 'PolicyWeb.store.Users',
                 'PolicyWeb.store.Emails',
                 'PolicyWeb.store.Netspoc',
                 'PolicyWeb.store.NetspocState',
                 'PolicyWeb.store.History',
                 'PolicyWeb.store.Owner',
                 'PolicyWeb.store.AllOwners',
                 'PolicyWeb.store.AllServices',
                 'PolicyWeb.store.CurrentPolicy',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.Service',
                 'PolicyWeb.view.Network',
                 'PolicyWeb.view.combo.OwnerCombo',
                 'PolicyWeb.view.combo.HistoryCombo',
                 'PolicyWeb.view.panel.grid.Services',
                 'PolicyWeb.view.panel.grid.Networks',
                 'PolicyWeb.view.panel.grid.AllServices',
                 'PolicyWeb.view.panel.grid.NetworkResources',
                 'PolicyWeb.view.panel.grid.Users',
                 'PolicyWeb.view.panel.grid.Rules',
                 'PolicyWeb.view.panel.grid.Emails',
                 'PolicyWeb.view.panel.card.PrintActive',
                 'PolicyWeb.view.panel.form.ServiceDetails',
                 'PolicyWeb.view.window.Search',
                 'PolicyWeb.view.button.ChooseService',
                 'PolicyWeb.view.button.PrintButton',
                 'PolicyWeb.view.button.PrintAllButton'
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
                               'AllOwners', 'AllServices', 'History',
                               'CurrentPolicy', 'Networks', 'NetworkResources'
                             ],
	controllers        : [ 'Main', 'Service', 'Network' ],
	launch             : function() {
        }
    }
);

