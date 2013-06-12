
Ext.define(
    'PolicyWeb.view.window.ExpandedServices',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.expandedservices',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'Alle aktuell angezeigten Dienste mit ' +
                        'zugehörigen Regeln',
                    width       : 800, 
                    height      : 600,
                    layout      : 'fit',
                    closeAction : 'hide',
                    items       : [
                        this.buildGrid()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildGrid : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.AllServices'
            );
        }
    }
);

