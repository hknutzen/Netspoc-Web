
// Main file that launches application.


/* This overrides the sorttypes (code taken from
 *  data\SortTypes.js File )*/
Ext.apply(
    Ext.data.SortTypes,
    {
        asUCText: function(s) {
            return germanize(String(s).toUpperCase().replace(this.stripTagsRE, ""));
        },
        asUCString: function(s) {
            return germanize(String(s).toUpperCase());
        },
        asText: function(s) {
            return germanize(String(s).replace(this.stripTagsRE, ""));
        },
        none: function(s) {
            return germanize(s);
        }
    }
);

Ext.Loader.setConfig(
    {
        enabled        : true,
        paths          : {
            'PolicyWeb' : './app',
            'Ext.ux'    : './resources/ux'
        }
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

	launch : function() {
            Ext.Ajax.on( 'requestexception', this.onJsonException );

            Ext.override(
                Ext.layout.CardLayout,
                {
                    getActiveItemIndex: function() {
                        return this.owner.items.indexOf(
                            this.getActiveItem() );
                    }
                }
            );
            // Initialize tooltips manager. Now a tooltip tag
            // "just works" for most components.
            Ext.tip.QuickTipManager.init();
        },
        
        onJsonException : function(connection, response, options, eOpts) {
            Ext.getBody().unmask();
            var msg, jsonData;
            try {
                jsonData = Ext.decode( response.responseText );
                msg = jsonData.msg;
                if ( !msg ) {
                    if ( options ) {
                        console.dir( options );
                    }
                }
            }
            catch (e) {
                msg = response.statusText;
            }
            msg = msg || 'Unbekannter Fehler (keine Meldung)';
            if (msg == 'Login required') {
                // The owner window is always rendered after the
                // message box is shown, so delay for 1s before
                // checking for the owner window to be present.
                // TODO: avoid showing both windows at the same
                // time at the first place, instead of closing
                // choose-owner-window if present.
                var task = new Ext.util.DelayedTask(
                    function(){}
                );
                task.delay(100);
                var window = Ext.getCmp( 'ownerWindow' );
                if (window) {
                    window.close();
                }
                Ext.MessageBox.show(
                    { title   : 'Sitzung abgelaufen', 
                      msg     : 'Neu anmelden',
                      buttons : Ext.MessageBox.OKCANCEL,
                      icon    : Ext.MessageBox.WARNING
                    });
            }
            else {
                Ext.MessageBox.show(
                    { title   : 'Fehler', 
                      msg     : msg,
                      buttons : Ext.MessageBox.OK,
                      icon    : Ext.MessageBox.ERROR
                    });
            }
        }
    }
);

