
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
                'PolicyWeb.view.panel.CardPrintActive', 
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
                            pressed       : true,
                            scope         : this,
                            handler       : function ( button ) {
                                var cardPanel = button.findParentByType( 'panel' );
                                cardPanel.layout.setActiveItem( 0 );
                            }
                        },
                        '-',
                        {
                            text         : 'Benutzer (User) des Dienstes',
                            toggleGroup  : 'polDVGrp',
                            enableToggle : true,
                            scope        : this,
                            handler      : function ( button ) {
                                var cardPanel = button.findParentByType( 'panel' );
                                cardPanel.layout.setActiveItem( 1 );
                            }
                        },
                        '->',
                        { xtype : 'printbutton' }
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
            var user = {
                html : 'USERPANEL'
            };
            return user;
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
            var emails = {
                region : 'south',
                html   : 'EMAILS'
            };
            return emails;
        },

        buildServiceDetailsView : function() {
            var details = this.buildServiceDetails();
            var rules   = this.buildServiceRules();
            var emails  = this.buildServiceEmails();
            var panel   =  {
                layout : 'border',
                items  : [
                    details,
                    rules,
                    emails
                ]
            };
            return panel;
        }
    }
);

