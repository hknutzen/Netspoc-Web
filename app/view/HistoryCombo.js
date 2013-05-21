

Ext.define(
    'PolicyWeb.view.HistoryCombo', {
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.historycombo',
        store          : 'Policies',
        forceSelection : true, 
        autoselect     : true,
        editable       : false,
        allowblank     : false,
        displayField   : undefined,
        valueField     : undefined,
        loadingText    : 'Abfrage l&auml;uft ...',
        mode           : 'remote',
        triggerAction  : 'all',
        tpl            : ('<tpl for="."><div class="x-combo-list-item">' +
                          '{date} {time} ({policy})' +
                          '</div></tpl>'),
        width          : 100,
        listConfig     : {
            minWidth : 200
        }
    }
);
