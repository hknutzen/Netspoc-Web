/*
 Main file that launches application.

(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>
            Heinz Knutzen     <heinz.knutzen@gmail.com>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/


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
        },
        asIP : function(value){
            // Add sortType "asIP" that converts IP addresses to
            // a numerical value which makes them sortable.
            var m1 = /-/;
            var m2 = /\//;
            var array;
            if ( value.match(m1) ) {
                array = value.split('-');
                return ip2numeric( array[0] );
            }
            else if ( value.match(m2) ) {
                array = value.split('/');
                return ip2numeric( array[0] );
            }
            else {
                return ip2numeric( value );
            }
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
                 'Ext.ux.DataTip',
                 'Ext.ux.grid.Printer',
                 'Ext.grid.plugin.BufferedRenderer',
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
                 'PolicyWeb.store.Connections',
                 'PolicyWeb.store.CurrentPolicy',
                 'PolicyWeb.store.DiffSetMail',
                 'PolicyWeb.store.DiffGetMail',
                 'PolicyWeb.store.DiffTree',
                 'PolicyWeb.store.OverviewOwnResources',
                 'PolicyWeb.store.SendNewUserTaskMail',
                 'PolicyWeb.store.SendDeleteUserTaskMail',
                 'PolicyWeb.store.Supervisors',
                 'PolicyWeb.store.SupervisorEmails',
                 'PolicyWeb.store.Watchers',
                 'PolicyWeb.view.Network',
                 'PolicyWeb.view.Service',
                 'PolicyWeb.view.Viewport',
                 'PolicyWeb.view.Account',
                 'PolicyWeb.view.button.ChooseService',
                 'PolicyWeb.view.button.PrintButton',
                 'PolicyWeb.view.button.PrintAllButton',
                 'PolicyWeb.view.combo.OwnerCombo',
                 'PolicyWeb.view.combo.OwnResourcesCombo',
                 'PolicyWeb.view.combo.HistoryCombo',
                 'PolicyWeb.view.container.TaskEmailInfo',
                 'PolicyWeb.view.panel.grid.AllServices',
                 'PolicyWeb.view.panel.grid.Emails',
                 'PolicyWeb.view.panel.grid.NetworkResources',
                 'PolicyWeb.view.panel.grid.Networks',
                 'PolicyWeb.view.panel.grid.OwnCurrentResources',
                 'PolicyWeb.view.panel.grid.Rules',
                 'PolicyWeb.view.panel.grid.Services',
                 'PolicyWeb.view.panel.grid.Supervisors',
                 'PolicyWeb.view.panel.grid.Users',
                 'PolicyWeb.view.panel.grid.Watchers',
                 'PolicyWeb.view.panel.grid.SupervisorEmails',
                 'PolicyWeb.view.panel.card.PrintActive',
                 'PolicyWeb.view.panel.form.ServiceDetails',
                 'PolicyWeb.view.container.TaskEmailInfo',
                 'PolicyWeb.view.tree.Diff',
                 'PolicyWeb.view.window.ExpandedServices',
                 'PolicyWeb.view.window.About',
                 'PolicyWeb.view.window.DeleteUser',
                 'PolicyWeb.view.window.DeleteFromRule',
                 'PolicyWeb.view.window.Search'
             ]
           );

Ext.application(
    {
	name               : 'PolicyWeb',
        appFolder          : './app',
	autoCreateViewport : true,
	models             : [ 'Netspoc', 'Service', 'Rule', 'Owner', 'Item',
                               'Overview' ],
	stores             : [ 'Netspoc', 'NetspocState', 'Service',
                               'Rules', 'Users', 'Emails', 'Owner',
                               'AllOwners', 'AllServices', 'History',
                               'CurrentPolicy', 'Networks', 'NetworkResources',
                               'DiffGetMail', 'DiffSetMail', 'DiffTree',
                               'Watchers', 'Supervisors', 'SupervisorEmails',
                               'OverviewOwnResources', 'Connections'
                             ],
	controllers        : [ 'Main', 'Service', 'Network',
                               'Diff', 'Account' ],

	init : function() {
            /*
             * Credit for the following fix goes to "rixo" on stackoverflow:
             * https://stackoverflow.com/questions/20636777/ext-js-tabpanel-rendering-infinite-grid-too-quickly#answer-20654251
             * 
             * This workaround is necessary because we use card panels and set
             * active item from code. ExtJs does not realize it needs to refresh
             * its BufferedRenderer view.
             * The follwing fixes that:
             */
            Ext.define(
                'Ext.ux.Ext.grid.plugin.BufferedRenderer.HiddenRenderingSupport', {
                    override : 'Ext.grid.plugin.BufferedRenderer',
                    
                    /**
                     * Refreshes the view and row size caches if they have a value of 0
                     * (meaning they have probably been cached when the view was not visible).
                     */
                    onViewResize: function() {
                        if (this.rowHeight === 0) {
                            if (this.view.body.getHeight() > 0) {
                                this.view.refresh();
                            }
                        } else {
                            this.callParent(arguments);
                        }
                    }
                }
            );
        },

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

            // Custom Vtype for textfields in forms (vtype:'IPAddress')
            Ext.apply(
                Ext.form.field.VTypes,
                {
                    IPAddress :  function(v) {
                        return (/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}-\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/).test(v);
                    },
                    IPAddressText : "IP-Adresse (mit Maske) oder Range. (Beispiele:" +
                        "  10.1.2.3 oder 10.1.2.0/24 oder 10.1.2.0 255.255.255.0 " +
                        "oder 10.1.2.0/255.255.255.0 oder 10.1.2.50-10.2.2.52)"
                    //IPAddressMask : /[\d\.\/-\s]/i
                }
            );

            // Initialize tooltips manager. Now a tooltip tag
            // "just works" for most components.
            Ext.tip.QuickTipManager.init();

            // Define these defaults for the gridprinter plugin.
            Ext.ux.grid.Printer.printLinkText = 'Drucken';
            Ext.ux.grid.Printer.closeLinkText = 'Schließen';
            Ext.ux.grid.Printer.pageTitle     = 'Druckansicht';
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
                /* Don't show error box in this case. This error is handled
                 * in Main.js .
                 */
            }
            else {
                Ext.MessageBox.show(
                    { title   : 'Fehler', 
                      msg     : msg,
                      buttons : Ext.MessageBox.OK,
                      icon    : Ext.MessageBox.ERROR
                    }
                );
            }
        }
    }
);

