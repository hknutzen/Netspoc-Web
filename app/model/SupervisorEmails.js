
Ext.define(
    'PolicyWeb.model.SupervisorEmails',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            {
                name   : 'email',
                header : 'x'
            }
        ],
        proxy  : {
            url : 'backend/get_admins_watchers'
        }
    }
);

