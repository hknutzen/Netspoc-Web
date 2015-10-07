

Ext.define(
    'PolicyWeb.store.SendNewUserTaskMail',
    {
        extend   : 'PolicyWeb.store.NetspocState',
        model    : 'PolicyWeb.model.Netspoc',
        autoLoad : false,
        proxy       : {
            type     : 'policyweb',
            proxyurl : 'send_task_mail'
        }
    }
);
