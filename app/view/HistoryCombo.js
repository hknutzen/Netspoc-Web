

Ext.define(
    'PolicyWeb.view.HistoryCombo', {
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.historycombo',
        store          : 'History',
        forceSelection : true, 
        autoselect     : true,
        editable       : false,
        allowblank     : false,
        displayField   : undefined,
        valueField     : undefined,
        loadingText    : 'Abfrage l&auml;uft ...',
        mode           : 'remote',
        triggerAction  : 'all',
        width          : 100,
        listConfig     : {
            minWidth : 200,
            itemTpl  : '{date} {time} ({policy})'
        }
    }
);
