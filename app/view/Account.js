
Ext.define(
    'PolicyWeb.view.Account',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.accountview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildAdminListPanel(),
                this.buildWatcherListPanel(),
                this.buildSupervisorListPanel(),
                this.buildSupervisorEmailsListpanel()
            ];
            
            this.callParent(arguments);
        },

        buildAdminListPanel : function() {
            var store = Ext.create(
                'PolicyWeb.store.Emails'
            );
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    id          : 'adminEmails',
                    title       : 'Verantwortliche',
                    store       : store,
                    border      : true
                }
            );
        },

        buildWatcherListPanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Watchers'
            );
        },

        buildSupervisorListPanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Supervisors'
            );
        },

        buildSupervisorEmailsListpanel : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.SupervisorEmails'
            );
        }
    }
);

