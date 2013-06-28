
Ext.define(
    'PolicyWeb.view.panel.grid.Networks',
    {
        extend      : 'Ext.grid.Panel',
        alias       : 'widget.networklist',
        controllers : [ 'Network' ],
        store       : 'Networks',
        forceFit    : true,
        flex        : 2,
        border      : false,
        selModel    : {
            selType     : 'checkboxmodel',
            mode        : 'MULTI',
            headerWidth : 12
        },
        viewConfig  : {
            loadMask : false
        },
        columns     : [
            { text : 'IP-Adresse',            dataIndex : 'ip'    },
            { text : 'Name',                  dataIndex : 'name'  },
            { text : 'Verantwortungsbereich', dataIndex : 'owner' }
        ],
        printview : function() {
            Ext.ux.grid.Printer.print( this );
        },
        
        select0 : function() {
            if ( this.getStore().getCount() > 0 ) {
                var selmodel = this.getSelectionModel();
                selmodel.select(0);
            }
        }
    }
);

