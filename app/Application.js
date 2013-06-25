
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
                 'PolicyWeb.store.DiffSetMail',
                 'PolicyWeb.store.DiffGetMail',
                 'PolicyWeb.store.DiffTree',
                 'PolicyWeb.store.Supervisors',
                 'PolicyWeb.store.Watchers',
                 'PolicyWeb.view.Network',
                 'PolicyWeb.view.Service',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.Account',
                 'PolicyWeb.view.button.ChooseService',
                 'PolicyWeb.view.button.PrintButton',
                 'PolicyWeb.view.button.PrintAllButton',
                 'PolicyWeb.view.combo.OwnerCombo',
                 'PolicyWeb.view.combo.HistoryCombo',
                 'PolicyWeb.view.panel.grid.AllServices',
                 'PolicyWeb.view.panel.grid.Emails',
                 'PolicyWeb.view.panel.grid.NetworkResources',
                 'PolicyWeb.view.panel.grid.Networks',
                 'PolicyWeb.view.panel.grid.Rules',
                 'PolicyWeb.view.panel.grid.Services',
                 'PolicyWeb.view.panel.grid.Supervisors',
                 'PolicyWeb.view.panel.grid.Users',
                 'PolicyWeb.view.panel.grid.Watchers',
                 'PolicyWeb.view.panel.card.PrintActive',
                 'PolicyWeb.view.panel.form.ServiceDetails',
                 'PolicyWeb.view.tree.Diff',
                 'PolicyWeb.view.window.ExpandedServices',
                 'PolicyWeb.view.window.Search'
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
                               'CurrentPolicy', 'Networks', 'NetworkResources',
                               'DiffGetMail', 'DiffSetMail', 'DiffTree',
                               'Watchers', 'Supervisors'
                             ],
	controllers        : [ 'Main', 'Service', 'Network',
                               'Diff', 'Account' ],
	launch             : function() {
        }
    }
);

