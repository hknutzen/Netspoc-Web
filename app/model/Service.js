
Ext.define(
  'PolicyWeb.model.Service',
  {
    extend: 'PolicyWeb.model.Netspoc',
    fields: [
      {
        name: 'name',
        sortType: 'asUCString'
      },
      {
        name: 'desc',
        mapping: 'description'
      },
      { name: 'disabled' },
      { name: 'disable_at' },
      { name: 'owner' },
      { name: 'all_owners' }
    ]
  }
);

