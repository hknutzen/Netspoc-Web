
Ext.define(
    'PolicyWeb.view.container.TaskEmailInfo',
    {
        extend : 'Ext.container.Container',
        alias  : 'widget.task_mail_info_container',
        loader :  {
            url      : 'html/task_mail_info_text',
            //margin   : '0 0 30 0',  // (top, right, bottom, left)
            autoLoad : true
        }
    }
);