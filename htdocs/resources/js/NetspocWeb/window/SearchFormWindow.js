Ext.ns("NetspocWeb.window");

/**
 * @class NetspocWeb.window.SearchFormWindow
 * @extends Ext.Window
 * A class to hsmanage choice of owner to use after being logged in.
 * @constructor
 */
NetspocWeb.window.SearchFormWindow = Ext.extend(
    Ext.Window, {

	initComponent : function() {
            // Force defaults
            Ext.apply( this,
 		       {
			   title       : 'IP-Adresse oder Zeichenkette suchen',
 			   width       : 450, 
 			   height      : 310,
 			   layout      : 'fit',
			   resizable   : false,
			   closeAction : 'hide',
 			   items       : [
			       this.buildForm()
 			   ],
			   focus     : function() {  // Focus search text field.
			       var txt_fields = this.findByType( 'textfield' );
			       txt_fields[0].focus(
				   false,   // don't select text on focus
				   true     // wait 10ms before setting focus (needed for IE)
			       );
 			   }
		       }
		     );
	    
            NetspocWeb.window.SearchFormWindow.superclass.initComponent.call(this);
	},
	
	//private builds the form.
	buildForm : function() {
	    
	    var searchtext = {
		xtype      : 'textfield',
		id         : 'search_string',
		width      : 330,
		emptyText  : 'Zeichenkette oder IP eingeben ... ',
		fieldLabel : 'Suchbegriff',
		allowBlank : false,
		minLength  : 2,
		listeners  : {
                    specialkey: function( field, e ){
			// Handle ENTER key press.
			if ( e.getKey() == e.ENTER ) {
			    var sb   = Ext.getCmp( 'buttonId' );
			    var v    = Ext.getCmp( 'viewportId' );
			    var pm   = v.findByType("policymanager");
                            var form = field.ownerCt.getForm();
			    sb.search_params = form.getValues();
			    pm[0].onButtonClick( sb );
			}
                    }
		}
	    };
	    
	    var checkbox_group1 = {
		xtype      : 'checkboxgroup',
		fieldLabel : 'Suche in',
		anchor     : '100%',
		columns    : 2,
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
			id         : 'cb-rule-id',
			boxLabel   : 'Regeln der Dienste',
			name       : 'search_in_rules'
		    },
		    {
			boxLabel   : 'Genutzte Dienste',
			name       : 'search_used'
		    },
		    {
			id         : 'cb-user-id',
			boxLabel   : 'Nutzer der Dienste (User)',
			name       : 'search_in_user'
		    },
		    {
			boxLabel   : 'Nutzbare Dienste',
			name       : 'search_visible'
		    },
		    {
			id         : 'cb-desc-id',
			boxLabel   : 'Dienstbeschreibungen',
			name       : 'search_in_desc'
		    },
		    {
			boxLabel   : 'Alle',
			name       : 'search_in_all_services',
			handler    : function( cb, checked ) {
			    var cbg = cb.findParentByType( 'checkboxgroup' );
			    if ( checked === true ) {
				cbg.setValue( [ true, true, true ] );
			    }
			    else {
				cbg.setValue( [ false, false, false ] );
			    }
			}
		    },
		    {
			boxLabel   : 'Alle',
			name       : 'search_in_all_details',
			handler    : function( cb, checked ) {
			    var cbg = cb.findParentByType( 'checkboxgroup' );
			    if ( checked === true ) {
				cbg.setValue(
				    {
					'cb-rule-id' : true,
					'cb-user-id' : true,
					'cb-desc-id' : true
				    }
				);
			    }
			    else {
				cbg.setValue(
				    {
					'cb-rule-id' : false,
					'cb-user-id' : false,
					'cb-desc-id' : false
				    }
				);
			    }
			}
		    }
		]
	    };
	    
	    var checkbox_group2 = {
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
			boxLabel   : 'Suchergebnisse nur mit ' 
			    + 'exakter Übereinstimmung',
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

	    var checkbox_container = {
		xtype  : 'container',
		layout : 'form',
		height : 120,
		items : [
		    checkbox_group1,
		    { height : 10 },
		    checkbox_group2

		]
	    };
	    
	    var radio_group = {
		xtype      : 'radiogroup',
		anchor     : '100%',
		//fieldLabel : 'IP oder String',
		items      : [
		    {
			boxLabel   : 'Zeichenkette',
			name       : 'search_ip_or_string'
		    },
		    {
			boxLabel   : 'IP-Adresse',
			name       : 'search_ip_or_string'
		    }
		]
	    };

	    var myFormPanel = new Ext.form.FormPanel(
		{
		    id           : 'myFormPanelId',
		    width        : 350,
		    height       : 270,
		    frame        : true,
		    bodyStyle    : 'padding: 6px',
		    labelWidth   : 70,
		    buttonAlign  : 'center',
		    layoutConfig : {
//			align : 'stretch'
		    },
		    items        : [
			{ height : 10 },
			searchtext,
			{ height : 10 },
//			radio_group,
			checkbox_container
		    ]
		}
	    );

	    var form = myFormPanel.getForm();
	    var search_button =
		myFormPanel.addButton( 
		    {   // button config
			id   : 'buttonId',
			text : 'Suche starten'
		    },
		    function( button, event ) {  // button click handler
			if ( form.isValid() ) {
			    button.search_params = form.getValues();
			    var v  = Ext.getCmp( 'viewportId' );
			    var pm = v.findByType("policymanager");
			    pm[0].onButtonClick( button );
			} else {
			    var m = 'Bitte Eingaben in rot markierten ' 
				+ 'Feldern korrigieren.';
			    Ext.MessageBox.alert( 'Fehlerhafte Eingabe!', m );
			}
		    },
		    myFormPanel    // scope in which the button handler function is executed
		);

	    return myFormPanel;
	}
    }
);



