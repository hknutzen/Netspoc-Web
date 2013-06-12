
/**
 * A class that configures a print-button that prints all
 * services and rules upon click.
 **/

Ext.define(
    'PolicyWeb.view.button.PrintAllButton',
    {
        extend  : 'Ext.button.Button',
        alias   : 'widget.print-all-button',
        iconCls : 'icon-table',
        tooltip : 'Druckansicht für alle aktuell angezeigten Dienste mit zugehörigen Regeln'
    }
);