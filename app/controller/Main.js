
Ext.define(
    'PolicyWeb.controller.Main', {
        extend : 'Ext.app.Controller',
        views  : [ 'Viewport' ],
        refs   : [
            {
                selector : 'mainview',
                ref      : 'mainView'   
            },
            {
                selector : 'ownercombo',
                ref      : 'ownerCombo'   
            }
        ],

        init: function() {
            
            this.control(
                {
                    'mainview': {
                        beforerender   : this.beforeViewportRendered,
                        logout         : this.onLogout
                    },
                    'ownercombo' : {
                        select         : this.onOwnerSelected,
                        ownerSet       : this.onOwnerSet
                    }
                }
            );
        },
        
        onOwnerSelected : function() {
        },
        
        onOwnerSet : function() {
            var ownercombo = this.getOwnerCombo();
            console.dir( ownercombo );
            ownercombo.setValue( appstate.getOwnerAlias() );
        },
        
        onLogout : function() {
            var store = Ext.create(
                'PolicyWeb.store.Netspoc',
                {
                    proxyurl    : 'logout',
                    fields      : [],
                    autoDestroy : true
                }
            );
            store.load(
                { params   : {},
                  callback : this.onAfterLogout,
                  scope    : this
                }
            );
        },

        onAfterLogout : function() {

            // Jump to login page,
            // which is assumed to be the default page in current directory.
            window.location.href = '.';
        },

        beforeViewportRendered: function( view ) {
            //console.log('BEFORE The viewport is rendered');
        }
    }
);