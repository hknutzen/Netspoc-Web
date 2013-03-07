Ext.ns('NetspocWeb.combo');

/* 
 * Extend combo class to show history entries
 */

NetspocWeb.combo.HistoryCombo = Ext.extend(
    Ext.form.ComboBox, {
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
        listWidth      : 200
});

Ext.reg( 'historycombo', NetspocWeb.combo.HistoryCombo );
