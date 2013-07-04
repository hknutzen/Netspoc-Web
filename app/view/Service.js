
var search_window;
var print_window;


Ext.define(
    'PolicyWeb.view.Service',
    {
        extend  : 'Ext.container.Container',
        alias   : 'widget.serviceview',
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items = [
                this.buildServiceListPanel(),
                this.buildServicePropertiesView()
            ];
            this.callParent(arguments);
        },
        
        buildServiceListPanel : function() {
            return {
              xtype : 'servicelist'
            };
        },

        buildServicePropertiesView : function() {
            var details = this.buildServiceDetailsView();
            var user    = this.buildServiceUserView();
            var srv_props = Ext.create(
                'PolicyWeb.view.panel.card.PrintActive', 
                {
                    flex         : 7,
                    activeItem   : 0,
                    layoutConfig : {
                        deferredRender : false,
                        // Sonst wird der Container mit 'trigger' 
                        // bei multi Owner nicht korrekt angezeigt,
                        // wenn man zwischen User und Details 
                        // wechselt.
                        layoutOnCardChange : true
                    },
                    tbar         : [
                        {
                            text          : 'Details zum Dienst',
                            toggleGroup   : 'polDVGrp',
                            enableToggle  : true,
                            pressed       : true
                        },
                        '-',
                        {
                            text         : 'Benutzer (User) des Dienstes',
                            toggleGroup  : 'polDVGrp',
                            enableToggle : true
                        },
                        '-',
                        {
                            xtype    : 'checkbox',
                            name     : 'expand_users',
                            boxLabel : 'User expandieren'
                        },
                        {
                            xtype    : 'checkbox',
                            name     : 'display_property',
                            boxLabel : 'Namen statt IPs'
                        },
                        '->',
                        {
                            xtype   : 'printbutton',
                            tooltip : 'Druckansicht für Regeln oder User des aktuell ausgewählten Dienstes'
                        }
                    ],
                    items : [
                        details,
                        user
                    ]
                }
            );
            return srv_props;
        },

        buildServiceUserView : function() {
            return {
                layout : 'border',
                items  : [
                    this.buildUserView(),
                    this.buildUserEmails()
                ]
            };
        },

        buildUserView : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Users',
                {
                    region : 'center'
                }
            );
        },
        
        buildUserEmails : function() {
            var store = Ext.create(
                'PolicyWeb.store.Emails'
            );
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    region : 'south',
                    id     : 'userEmails',
                    store  : store
                }
            );
        },

        buildServiceDetails : function() {
            return Ext.create(
                'PolicyWeb.view.panel.form.ServiceDetails',
                {
                    region : 'north'
                }
            );
        },

        buildServiceRules : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Rules',
                {
                    region : 'center'
                }
            );
        },

        buildServiceEmails : function() {
            return Ext.create(
                'PolicyWeb.view.panel.grid.Emails',
                {
                    region : 'south',
                    id     : 'ownerEmails'
                }
            );
        },

        buildServiceDetailsView : function() {
            var details = this.buildServiceDetails();
            var rules   = this.buildServiceRules();
            var emails  = this.buildServiceEmails();
            return {
                layout : 'border',
                items  : [
                    details,
                    rules,
                    emails
                ]
            };
        }
    }
);

