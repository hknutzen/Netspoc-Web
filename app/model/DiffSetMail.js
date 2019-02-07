
Ext.define(
    'PolicyWeb.model.DiffSetMail',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name : 'send'  }
        ],
        proxy  : {
            url : 'backend/set_diff_mail'
        }
    }
);

