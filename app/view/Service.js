
var search_window;
var print_window;


Ext.define(
    'PolicyWeb.view.Service',
    {
        extend     : 'Ext.container.Container',
        alias      : 'widget.serviceview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items = [
                //this.buildServiceListPanel()
                //this.buildPolicyDetailsView()
            ];
            
            this.callParent();
        },
        
        buildServiceListPanel : function() {
/*
            return {
              xtype : 'servicelist'
            };
*/
        }
    }
);

