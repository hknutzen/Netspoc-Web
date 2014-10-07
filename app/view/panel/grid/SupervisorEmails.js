
Ext.define(
    'PolicyWeb.view.panel.grid.SupervisorEmails',
    {
        extend      : 'PolicyWeb.view.panel.grid.Emails',
        alias       : 'widget.supervisoremaillist',
        controllers : [ 'Account' ],
        store       : 'SupervisorEmails',
        title_prefix : 'Berechtigte'
    }
);

