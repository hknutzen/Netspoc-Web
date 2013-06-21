
Ext.define(
    'PolicyWeb.view.Diff',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.diffview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildDiffTreeView()
            ];
            this.callParent(arguments);
        },
        
        buildDiffTreeView : function() {
            return Ext.create(
                'PolicyWeb.view.tree.Diff'
            );
        }
    }
);

