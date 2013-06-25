
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
                    width       : 400, 
                    height      : 410,
                    layout      : 'fit',
                    resizable   : false,
                    closeAction : 'hide',
                    items       : [
                        this.buildForm()
                    ]
                }
            );
            this.callParent(arguments);
        },
        
        buildForm : function() {
            
            var search_term = {
                xtype      : 'textfield',
                name       : 'search_string',
                anchor     : '100%',
                emptyText  : 'Zeichenkette oder IP eingeben ... ',
                minLength  : 2
            };

            var fs_services = {
                // Fieldset with checkboxgroup to select
                // in which services should be searched.
                xtype       : 'fieldset',
                title       : 'In welchen Diensten und in welchen Dienste-Details suchen?',
                defaultType : 'textfield',
                defaults    : { anchor: '100%' },
                items       : [
                    this.buildServiceCheckboxGroup()
                ]
            };

            var fs_search_term = {
                // Fieldset defining in which parts of services
                // to search.
                xtype  : 'fieldset',
                title  : 'Suchbegriff',
                items  : [
                    search_term
                ]
            };

            var fs_search_in = {
                // Fieldset defining in which parts of services
                // to search.
                xtype  : 'fieldset',
                title  : 'Weitere Optionen',
                items  : [
                    this.buildOptionsCheckboxGroup()
                ]
            };

            var form_panel = Ext.create(
                'Ext.form.Panel', {
                    frame       : true,
                    buttonAlign : 'center',
                    items       : [
                        fs_search_term,
                        fs_services,
                        fs_search_in
                    ],
                    buttons     : [
                        {
                            text  : 'Suche starten'
                        }
                    ]
                }
            );
            return form_panel;
        },

        buildServiceCheckboxGroup : function () {
            return {
                xtype      : 'checkboxgroup',
                columns    : 2,
                vertical   : true,
                flex       : 1,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Eigene Dienste',
                        name       : 'search_own'
                    },
                    {
                        boxLabel   : 'Genutzte Dienste',
                        name       : 'search_used'
                    },
                    {
                        boxLabel   : 'Nutzbare Dienste',
                        name       : 'search_visible'
                    },
                    {
                        boxLabel   : 'Alle (de-)selektieren',
                        name       : 'search_in_all_services'
                    },
                    {
                        boxLabel   : 'Regeln der Dienste',
                        name       : 'search_in_rules'
                    },
                    {
                        boxLabel   : 'Nutzer der Dienste (User)',
                        name       : 'search_in_user'
                    },
                    {
                        boxLabel   : 'Dienstbeschreibungen',
                        name       : 'search_in_desc'
                    },
                    {
                        boxLabel   : 'Alle (de-)selektieren',
                        name       : 'search_in_all_details'
                    }
                ]
            };
        },

        buildOptionsCheckboxGroup : function () {
            return {
                xtype      : 'checkboxgroup',
                anchor     : '100%',
                columns    : 1,
                flex       : 2,
                defaults   : {
                    checked    : true
                },
                items      : [
                    {
                        boxLabel   : 'Groß-/Kleinschreibung beachten',
                        name       : 'search_case_sensitive'
                    },
                    {
                        boxLabel   : 'Suchergebnisse nur mit ' +
                            'exakter Übereinstimmung',
                        name       : 'search_exact',
                        checked    : false
                    },
                    {
                        boxLabel   : 'Such-Fenster im Vordergrund halten',
                        name       : 'keep_front',
                        checked    : false
                    }
                ]
            };
        }
    }
);

