

Ext.define(
    'PolicyWeb.view.Viewport',
    {
	extend   : 'Ext.container.Viewport',
        alias    : 'widget.mainview',
	layout   : 'fit',
        
	initComponent : function() {
            this.items = this.buildViewport();
            this.callParent(arguments);
        },

        buildViewport : function () {

            var cardPanel = {
                xtype          : 'panel',
                layout         : 'card',
                activeItem     : 0,
                layoutConfig   : { deferredRender : true },
                border         : false,
                items          :  [
                    // Index of items must be the same as
                    // index of buttons in toolbar below.
                    { xtype : 'serviceview' },
                    { xtype : 'networkview' },
                    { xtype : 'diffview'    },
                    { xtype : 'accountview' }
                ],
                tbar   : [
                    {
                        text         : 'Dienste, Freischaltungen',
                        iconCls      : 'icon-chart_curve',
                        toggleGroup  : 'navGrp',
                        enableToggle : true,
                        pressed      : true
                    },
                    {
                        text         : 'Eigene Netze',
                        iconCls      : 'icon-computer_connect',
                        toggleGroup  : 'navGrp',
                        enableToggle : true
                    },
                    {
                        text         : 'Diff',
                        iconCls      : 'icon-chart_curve_edit',
                        toggleGroup  : 'navGrp',
                        enableToggle : true
                    },
                    {
                        text         : 'Berechtigungen',
                        iconCls      : 'icon-group',
                        toggleGroup  : 'navGrp',
                        enableToggle : true
                    },
                    '->',
                    'Stand',
                    { xtype : 'historycombo' },
                    ' ',
                    'Verantwortungsbereich',
                    { xtype : 'ownercombo' },
                    ' ',
                    'Abmelden',
                    {
                        iconCls : 'icon-door_out',
                        scope   : this,
                        handler : this.fireLogoutEvent
                    }
                ]
            };
            return cardPanel;
	},
        
        fireLogoutEvent : function() {
            this.fireEvent( 'logout' );
        }
    }
);