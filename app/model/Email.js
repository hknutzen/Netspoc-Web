
Ext.define(
    'PolicyWeb.model.Email',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name : 'email', header : 'Verantwortliche' }
        ],
        proxy    : {
            url : 'backend/get_admins'
        }
    }
);

