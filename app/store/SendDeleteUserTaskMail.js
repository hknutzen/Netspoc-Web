

Ext.define(
    'PolicyWeb.store.SendDeleteUserTaskMail',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Netspoc',
        autoLoad : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'send_delete_user_task_mail'
        }
    }
);
