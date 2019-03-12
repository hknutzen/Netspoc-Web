
Ext.define(
    'PolicyWeb.model.Watcher',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            {
                name   : 'email',
                header : 'x'
            }
        ],
        proxy  : {
            url : 'backend/get_watchers'
        }
    }
);

