
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

	// Store is reloaded manually, when HistoryCombo is selected,
        // but isn't reloaded, when diffHistoryCombo is selected.
        queryMode      : 'local',

        // Is needed, for filterBy of diffHistoryCombo to work.
        lastQuery      : '',
        width          : 140,
        listConfig     : {
            minWidth : 200,
            itemTpl  : '{date} {time} ({policy})'
        }
    }
);
