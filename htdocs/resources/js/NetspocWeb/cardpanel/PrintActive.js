
Ext.ns("NetspocWeb.cardpanel");

NetspocWeb.cardpanel.PrintActive = Ext.extend(
    Ext.Panel, {
	layout  : 'card',

	initComponent : function() {
            NetspocWeb.cardpanel.PrintActive.
		superclass.initComponent.call(this);
	},

	printView : function() {
	    var layout      = this.getLayout();
            var activePanel = layout.activeItem;
	    if ( activePanel.layout ) {
//		console.log( activePanel.layout.type );
		if ( activePanel.layout.type == 'border' ) {
		    var cp = activePanel.layout.center.panel;
		    var sp = activePanel.layout.south.panel;
		    if ( cp ) {
			cp.printView();
		    }
		    //if ( sp ) {
		    //sp.printView();
		    //}
		}
		else if ( activePanel.layout.type == 'fit' ) {
		    activePanel.printView();
		}
		else {
		    console.log( "CardPanel.PrintActive: unhandled layout!" );
		}
	    }
	    else {
		console.log( "No layout defined for active panel in cardpanel!" );
	    }
	}
    }
);

Ext.reg( 'cardprintactive', NetspocWeb.cardpanel.PrintActive );
