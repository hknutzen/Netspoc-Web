
Ext.define(
    'PolicyWeb.controller.Account', {
        extend : 'Ext.app.Controller',
        stores : [ 'Watchers', 'Emails', 'Supervisors' ],
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
                selector : '#supervisorEmails',
                ref      : 'supervisorEmailList'
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
            this.getSupervisorsStore().load();
        },
        
        onSupervisorSelected : function( rowmodel, supervisor, index, eOpts ) {
            var email_panel = this.getSupervisorEmailList();
            if ( supervisor ) {
                email_panel.show( supervisor.get('name'),
                                  supervisor.get('alias') );
            }
            else {
                email_panel.clear();
                return true;
            }
            return true;
        }
    }
);