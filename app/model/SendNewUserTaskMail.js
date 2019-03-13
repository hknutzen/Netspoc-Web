
Ext.define(
    'PolicyWeb.model.SendNewUserTaskMail',
    {
        extend : 'PolicyWeb.model.Base',
        proxy : {
            url : 'backend/send_add_user_task_mail'
        }
    }
);

