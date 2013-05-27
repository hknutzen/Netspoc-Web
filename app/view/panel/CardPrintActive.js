
/**
 * A class that configures a card-panel to have a printable
 * currently active view.
 **/

Ext.define(
    'PolicyWeb.view.panel.CardPrintActive',
    {
        extend    : 'Ext.panel.Panel',
        alias     : 'widget.cardprintactive',
        layout    : 'card',

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