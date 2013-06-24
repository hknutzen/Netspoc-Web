
Ext.define(
    'PolicyWeb.view.tree.Diff',
    {
        extend          : 'Ext.tree.Panel',
        alias           : 'widget.diffview',
        controllers     : [ 'Diff' ],
        store           : 'DiffTree',
        useArrows       : true,
        autoScroll      : true,
        autoShow        : true,
        animate         : false,
        containerScroll : true,
        border          : false,

        initComponent : function() {
            var checkbox = Ext.create(
                'Ext.form.field.Checkbox'
            );
            var combo = Ext.create(
                'PolicyWeb.view.combo.HistoryCombo'
            );
            this.tbar = [
                'Vergleiche mit', 
                combo,
                ' ',
                {
                    xtype             : 'button',
                    text              : 'Diff per Mail senden',
                    handleMouseEvents : false,
                    tooltip           : 
                    'Vergleicht am Ende eines Tages' +
                        ' den aktuellen Stand ' +
                        ' mit dem Stand des Vortags' +
                        ' und sendet Ihnen bei Änderungen eine Mail.'
                },
                checkbox
            ];
            this.callParent(arguments);
        }
    }
);


