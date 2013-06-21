
Ext.define(
    'PolicyWeb.view.combo.HistoryCombo', {
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.historycombo',
        store          : 'History',
        forceSelection : false,
        autoSelect     : true,
        editable       : false,
        allowblank     : false,
        displayField   : undefined,
        valueField     : undefined,
        loadingText    : 'Abfrage l&auml;uft ...',
        mode           : 'remote',
        triggerAction  : 'all',
        width          : 140,
        listConfig     : {
            minWidth : 200,
            itemTpl  : '{date} {time} ({[ values.current === 1 ? "aktuell" : values.policy ]})'
        }
    }
);
