
Ext.define(
    'PolicyWeb.model.SendDelUserTaskMail',
    {
        extend : 'PolicyWeb.model.Base',
        proxy : {
            url : 'backend/send_delete_user_task_mail'
        }
    }
);

