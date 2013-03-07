
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
//              console.log( activePanel.layout.type );
                if ( activePanel.layout.type == 'border' ) {
                    var cp = activePanel.layout.center.panel;
                    if ( activePanel.layout.north ) {
                        var np = activePanel.layout.north.panel;
                        if ( np ) {
                            np.printView();
                        }
                    }
                    if ( activePanel.layout.south ) {
                        var sp = activePanel.layout.south.panel;
                        //if ( sp ) {
                        //sp.printView();
                        //}
                    }
                    if ( cp ) {
                        cp.printView();
                    }
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
