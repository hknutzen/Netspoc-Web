
Ext.define(
    'PolicyWeb.model.DiffGetMail',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name : 'send'  }
        ],
        proxy  : {
            url : 'backend/get_diff_mail'
        }
    }
);

