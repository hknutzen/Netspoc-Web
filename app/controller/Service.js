
Ext.define(
    'PolicyWeb.controller.Service', {
        extend : 'Ext.app.Controller',
        requires   : [ 'PolicyWeb.store.ServiceList',
                       'PolicyWeb.view.Service',
                       'PolicyWeb.view.ServiceList'
                     ],
        views  : [ 'Service', 'ServiceList' ],
        stores : [ 'ServiceList' ],
        models : [ 'ServiceList' ],
        refs   : [
        ],

        init: function() {
            this.control(
                {
                    'serviceview': {
                        afterrender  : this.onViewportRendered
                    },
                    'serviceview > servicelist': {
                        beforerender    : this.beforeRenderServices,
                        afterrender     : this.afterRenderServices,
                        selectionchange : this.onServiceSelected
                    },
                    'serviceview > grid button': {
                        click : this.onButtonClick
                    }                    
                }
            );
        },
        
        onServiceSelected : function( rowmodel, record, index, eOpts ) {
            // Load details and rules for selected service.
        },
        
        onViewportRendered : function( view ) {
            //console.log('The serviceview was rendered');
        },

        beforeRenderServices : function( grid ) {
            console.log('ABOUT TO LOAD STORE ........');
            // Load store before grid is rendered.
            // Select first row after store load.
            var store = grid.getStore();
            store.addListener( 'load', function () {
                                   grid.getSelectionModel().select(0);
                               }
                             );
            store.getProxy().extraParams.relation = 'user';
            store.load();
        },

        afterRenderServices: function( grid ) {
        },

        onButtonClick : function( btn, event, eOpts ) {
            console.log( 'Clicked on button ' + btn.getText() );
        }
    }
);