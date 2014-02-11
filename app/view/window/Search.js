
Ext.define(
    'PolicyWeb.view.window.Search',
    {
        extend  : 'Ext.window.Window',
        alias   : 'widget.searchwindow',

        initComponent : function() {
            // Force defaults
            Ext.apply(
                this,
                {
                    title       : 'IP-Adresse oder Zeichenkette suchen',
                    width       : 350, 
                    height      : 460,
                    resizable   : false,
                    closeAction : 'hide',
                    items       : [
                        this.buildSearchForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildSearchForm : function () {

            var form = Ext.widget(
                {
                    xtype         : 'form',
                    buttonAlign   : 'center',
                    bodyPadding   : 5,
                    width         : '100%',
                    fieldDefaults : {
                        labelAlign : 'left',
                        msgTarget  : 'top'
                    },
                    items: [
                        this.buildTabPanel(),
                        this.buildOptionsFieldSet(),
                        this.buildGeneralOptionsFieldSet()
                    ],
                    
                    buttons : [
                        {
                            text  : 'Suche starten'
                        }
                    ]
                }
            );
            return form;
	},
        
        buildTabPanel : function() {
            var tab_panel = {
                xtype     : 'tabpanel',
                plain     : true,
                activeTab : 0,
                height    : 220,
                defaults  : {
                    bodyPadding : 10
                },
                items : [
                    this.buildGeneralSearchTab(),
                    this.buildIPSearchTab()
                ]
            };
            return tab_panel;
        },

        buildGeneralSearchTab : function() {
            var textfield = {
                xtype     : 'textfield',
                name      : 'search_string',
                blankText : 'Eine Suche ohne Suchbegriff macht keinen Sinn',
                emptyText : 'Suchbegriff eingeben'
            };

            var fieldset = {
                xtype       : 'fieldset',
                title       : 'Suchbegriff',
                defaults    : { anchor : '100%' },
                items       : [
                    textfield
                ]
            };
            var options = {
                xtype       : 'fieldset',
                title       : 'Suche in ...',
                defaults    : { anchor : '100%' },
                items       : [
                    this.buildOptionsCheckboxGroup()
                ]
            };
            return {
                title    : 'Allgemeine Suche',
                layout   : 'anchor',
                items : [
                    fieldset,
                    options
                ]
            };
        },

        buildOptionsCheckboxGroup : function() {
            return {
                xtype       : 'checkboxgroup',
                columns     : 1,
                flex        : 5,
                defaults    : {
                    checked : false
                },
                items       : [
                    {
                        boxLabel   : 'Namen der Dienste',
                        name       : 'search_in_service_names'
                    },
                    {
                        boxLabel   : 'Dienstbeschreibungen',
                        name       : 'search_in_desc'
                    },
                    {
                        boxLabel   : 'Regeln der Dienste',
                        name       : 'search_in_rules'
                    },
                    {
                        boxLabel   : 'Nutzer (User) der Dienste',
                        name       : 'search_in_user'
                    }
                ]
            };
        },
        
        buildGeneralOptionsCheckboxGroup : function() {
            return {
                xtype       : 'checkboxgroup',
                columns     : 1,
                flex        : 5,
                defaults    : {
                    checked : false
                },
                items       : [
                    {
                        boxLabel   : 'Groß-/Kleinschreibung beachten',
                        name       : 'search_case_sensitive'
                    },
                    {
                        boxLabel   : 'Suchergebnisse nur mit ' +
                            'exakter Übereinstimmung',
                        name       : 'search_exact'
                    },
                    {
                        boxLabel   : 'Such-Fenster im Vordergrund halten',
                        name       : 'keep_front'
                    }
                ]
            };
        },
        
        buildGeneralOptionsFieldSet : function() {
            return {
                xtype       : 'fieldset',
                title       : 'Allgemeine Optionen',
                defaults    : { anchor : '100%' },
                items       : [
                    this.buildGeneralOptionsCheckboxGroup()
                ]
            };
        },

        buildOptionsFieldSet : function() {
            var sf_srv_cbg = {
                xtype      : 'checkboxgroup',
                columns    : 3,
                vertical   : true,
                flex       : 1,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Eigene',
                        name       : 'search_own'
                    },
                    {
                        boxLabel   : 'Genutzte',
                        name       : 'search_used'
                    },
                    {
                        boxLabel   : 'Nutzbare',
                        name       : 'search_visible',
                        checked    : false
                    }
                ]
            };

            return {
                // Fieldset with checkboxgroup to select
                // in which services should be searched.
                xtype       : 'fieldset',
                title       : 'In welchen Diensten suchen?',
                defaults    : { anchor : '100%' },
                items       : [
                    sf_srv_cbg
                ]
            };
        },

        buildIPSearchTab : function() {
            return {
                title : 'Ende-zu-Ende-Suche',
                items : [
                    this.buildSideTabPanel()
                ]
            };
        },

        buildSideTabPanel : function() {
            var tab = {
                xtype       : 'tabpanel',
                defaults  : {
                    bodyPadding : 5
                },
                tabPosition : 'right',
                plain       : true,
                activeTab   : 0,
                items       : [
                    this.buildIPSearchPanel(),
                    this.buildInfoPanel()
                ]
            };
            return tab;
        },

        buildIPSearchPanel : function() {
            var cbg = {
                xtype      : 'checkboxgroup',
                columns    : 1,
                vertical   : true,
                flex       : 1,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Übergeordnete Netze einbeziehen',
                        name       : 'search_supernet'
                    },
                    {
                        boxLabel   : 'Enthaltene Netze einbeziehen',
                        name       : 'search_subnet'
                    }
                ]
            };
            var fieldset = {
                xtype       : 'fieldset',
                title       : 'Wonach soll gesucht werden?',
                defaults    : { anchor : '100%' },
                items       : [
                    {
                        xtype          : 'textfield',
                        id             : 'ip1',
                        name           : 'search_ip1',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 0 0',  // top,r,b,l
                        emptyText      : 'IP oder Zeichenkette',
                        fieldLabel     : 'IP 1',
                        tooltip        : 'IP (Klassisch: 10.1.2.3.4/255.255.255.0 oder in CIDR-Notation: 10.1.2.3.4/24) oder Zeichenkette eingeben'
                    },
                    {
                        xtype          : 'textfield',
                        id             : 'ip2',
                        name           : 'search_ip2',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 0 0',  // top,r,b,l
                        emptyText      : 'IP oder Zeichenkette',
                        fieldLabel     : 'IP 2',
                        tooltip        : 'IP (Klassisch: 10.1.2.3.4/255.255.255.0 oder in CIDR-Notation: 10.1.2.3.4/24) oder Zeichenkette eingeben'
                    },
                    {
                        xtype          : 'textfield',
                        name           : 'search_proto',
                        labelWidth     : 60,
                        margin         : '0 10 0 0', // top,r,b,l
                        padding        : '4 0 10 0', // top,r,b,l
                        emptyText      : 'Protokoll oder Port',
                        fieldLabel     : 'Protokoll',
                        tooltip        : 'Protokoll (z.B. "tcp" oder "udp" oder Port), nach dem gefiltert werden soll'
                    },
                    cbg
                ]
            };
            return {
                title  : 'Parameter',
                height : 170,
                width  : 300,
                items  : [
                    fieldset
                ]
            };
        },

        buildInfoPanel : function() {
            var info = Ext.widget(
                'panel',
                {
                    title  : 'Info',
                    iconCls : 'icon-info',
                    border : false,
                    height : 170,
                    width  : 480,
                    loader : {
                        autoLoad : true,
                        url      : 'html/explain_ip_search'
                    },
                    style  : {
                        'padding'       : '5px',
                        'margin'        : '5px',
                        'border-radius' : '6px 6px 6px 6px',
                        'box-shadow'    : '0 0 5px rgba(0, 0, 0, 0.3)'
                    },
                    bodyStyle : {
                        'color' : '#646464'
                    }
                }
            );
            return info;
        }
    }
);   
