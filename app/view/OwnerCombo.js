

Ext.define(
    'PolicyWeb.view.OwnerCombo', {
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.ownercombo',
        id             : 'cbOwnerId',
        forceSelection : true, 
        autoselect     : true,
        editable       : true,
        allowblank     : false,
        selectOnFocus  : true,
        typeAhead      : true,
        minChars       : 1,
        displayField   : 'alias',
        valueField     : 'name',
        loadingText    : 'Abfrage l&auml;uft ...',
        mode           : 'local',
        store          : 'Owner',
        triggerAction  : 'all',
        listWidth      : 400
    }
);
