
Ext.define(
    'PolicyWeb.model.OverviewOwnResource',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            {
                name     : 'resource',
                sortType : 'asIP'
            }
        ],
        proxy  : {
            url : 'backend/get_own_resources'
        }
    }
);
