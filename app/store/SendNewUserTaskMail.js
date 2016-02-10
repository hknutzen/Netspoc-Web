

Ext.define(
    'PolicyWeb.store.SendNewUserTaskMail',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Netspoc',
        autoLoad : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'send_add_user_task_mail'
        }
    }
);
