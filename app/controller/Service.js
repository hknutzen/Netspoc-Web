
Ext.define(
    'PolicyWeb.controller.Service', {
        extend : 'Ext.app.Controller',
        views  : [ 'Services', 'panel.form.ServiceDetails' ],
        stores : [ 'Service' ],
        refs   : [
            {
                selector : 'servicelist',
                ref      : 'serviceGrid'
            },
            {
                selector : 'servicedetails',
                ref      : 'serviceDetailsForm'
            }
        ],

        init: function() {
            this.control(
                {
                    'serviceview' : {
                        afterrender  : this.onViewportRendered
                    },
                    'serviceview > servicelist' : {
                        beforerender    : this.beforeRenderServices,
                        afterrender     : this.afterRenderServices,
                        selectionchange : this.onServiceSelected
                    },
                    'serviceview > grid button' : {
                        click : this.onButtonClick
                    }                    
                }
            );
            // Listen for application-wide events.
            this.application.on(
                {
                    some_event : this.doSth,
                    scope      : this
                }
            );

        },

        onLaunch : function () {
            var store = this.getServiceStore();
            var grid  = this.getServiceGrid();
            store.on( 'load',
                      function () {
                          grid.on( 'afterrender',
                                   function () {
                                       var selmodel = grid.getSelectionModel();
                                       selmodel.select(0);
                                       debugger;
                                   }
                                 );
                          //var selmodel = grid.getSelectionModel();
                          //selmodel.select(0);
                      }
                    );

            appstate.addListener(
                'changed', 
                function () {
                    store.getProxy().extraParams.relation = 'user';
                    store.load();
                },
                this
            );
        },
        
        onServiceSelected : function( rowmodel, records, index, eOpts ) {
            // Load details, rules and emails of owners
            // for selected service.
            var record = records[0];
            console.log( 'Selected service ' + record.get( 'name' ) );
            var grid     = this.getServiceGrid();
            var selected = grid.getSelectionModel().getSelection();
            var service  = selected[0];
            
            if (! service) {
                this.clearDetails();
                return;
            }

            // Merge delegated owner and (multiple) std. owners.
            var sub_owner = service.get( 'sub_owner' );
            var array = service.get( 'owner' );
            var all_owners;
            if (sub_owner) {
                sub_owner.sub_owner = true;
                all_owners = [];
                all_owners = all_owners.concat(sub_owner, array);
            }
            else {
                all_owners = array;
            }
            service.set('all_owners', all_owners);

            // Load details form with values from selected record.
            //var form = getServiceDetailsForm();
            //form.loadRecord( service );

        },
        
        clearDetails : function() {
            
        },

        onViewportRendered : function( view ) {
            //console.log('The serviceview was rendered');
        },

        beforeRenderServices : function( grid ) {
        },

        doSth : function( event ) {
        },

        afterRenderServices: function( grid ) {
        },

        onButtonClick : function( button, event, eOpts ) {
            var relation = button.relation || '';
            var store    = this.getServiceStore();
            var proxy    = store.getProxy();
            var grid     = this.getServiceGrid();
            // Don't reload store if button clicked on is the one
            // that was already selected.
            if ( relation && relation === proxy.extraParams.relation ) {
                return;
            }
            proxy.extraParams.relation = relation;
            store.load();
        }
    }
);