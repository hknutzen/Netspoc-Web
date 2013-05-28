

Ext.define(
    'PolicyWeb.view.OwnerCombo', {
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.ownercombo',
        store          : 'AllOwners',
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
        queryMode      : 'local',
        triggerAction  : 'all',
        listConfig     : {
            minWidth   : 400
        }
    }
);
