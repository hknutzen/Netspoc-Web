
Ext.define(
    'PolicyWeb.view.panel.form.ServiceDetails',
    {
        extend      : 'Ext.form.Panel',
        alias       : 'widget.servicedetails',
        defaultType : 'textfield',
        defaults    : { anchor : '100%' },
        border      : false,
        style       : { "margin-left" : "3px" },
        items       : [
            { fieldLabel : 'Name',
              name       : 'name',
              readOnly   : true
            },
            { fieldLabel : 'Beschreibung',
              name       : 'desc',
              readOnly   : true
            },
            { xtype : 'hidden',
              name  : 'all_owners'
            },
            {
                xtype      : 'fieldcontainer',
                fieldLabel : 'Verantwortung',
                layout     : 'hbox',
                items      : [
                    { xtype   : 'button',
                      hidden  : true,
                      flex    : 0,
                      iconCls : 'icon-group'
                    },
                    { xtype      : 'textfield',
                      flex       : 1,
                      name       : 'owner1',
                      readOnly   : true
                    }
                ]
            }
        ]
    }
);