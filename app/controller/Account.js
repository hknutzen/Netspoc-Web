
Ext.define(
    'PolicyWeb.controller.Account', {
        extend : 'Ext.app.Controller',
        stores : [ 'Watchers', 'Emails', 'Supervisors', 'SupervisorEmails' ],
        refs   : [
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'
            },
            {
                selector : 'watcherlist',
                ref      : 'watchersGrid'
            },
            {
                selector : 'supervisorlist',
                ref      : 'supervisorsGrid'
            },
            {
                selector : 'supervisoremaillist',
                ref      : 'supervisorEmailGrid'
            },
            {
                selector : '#adminEmails',
                ref      : 'adminEmailList'
            }
        ],

        init : function() {
            this.control(
                {
                    'accountview' : {
                        beforeactivate : this.onBeforeActivate
                    },
                    'accountview supervisorlist' : {
                        select : this.onSupervisorSelected
                    }
                }
            );
        },

        onLaunch : function () {
            var store = this.getSupervisorsStore();
            store.on( 'load',
                      function () {
                          this.getSupervisorsGrid().select0();
                      },
                      this
                    );
            appstate.addListener(
                'changed', 
                function () {
                    if ( appstate.getInitPhase() ) { return; }
                    var cardpanel = this.getMainCardPanel();
                    var index = cardpanel.getLayout().getActiveItemIndex();
                    if ( index === 3 ) {
                        this.onBeforeActivate();
                    }
                },
                this
            );
        },
        
        onBeforeActivate : function ( new_card, old_card ) {
            this.getAdminEmailList().getStore().load();
            this.getWatchersStore().load();
            this.getSupervisorEmailGrid().clear();
            this.getSupervisorsStore().load();
        },
        
        onSupervisorSelected : function( rowmodel, supervisor, index, eOpts ) {
            var email_panel = this.getSupervisorEmailGrid();
            if ( supervisor ) {
                email_panel.show( supervisor.get('name'),
                                  supervisor.get('alias') );
            }
            return true;
        }
    }
);