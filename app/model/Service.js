
Ext.define(
    'PolicyWeb.model.Service',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name     : 'name',
              sortType : 'asUCString' 
            },
            { name     : 'desc',
              mapping  : 'description' },
            { name : 'disabled'   },
            { name : 'disable_at'},
            { name : 'owner'      },
            { name : 'all_owners' },
            { name : 'sub_owner'  }
        ],
        proxy : {
            url : 'backend/service_list'
        }
    }
);

