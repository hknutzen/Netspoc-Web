
/**
 * A class that configures a card-panel to have a printable
 * currently active view.
 **/

Ext.define(
    'PolicyWeb.view.panel.card.PrintActive',
    {
        extend    : 'Ext.panel.Panel',
        alias     : 'widget.cardprintactive',
        layout    : 'card',

        printview : function( options ) {
            var layout      = this.getLayout();
            var activePanel = layout.activeItem;
            if ( activePanel.layout ) {
                if ( activePanel.layout.type == 'border' ) {
                    var cp = activePanel.down( 'grid[region=center]' );
                    Ext.ux.grid.Printer.print( cp );
                }
                else if ( activePanel.layout.type == 'fit' ) {
                    Ext.ux.grid.Printer.print( activePanel );
                }
                else {
                    console.log( "panel.card.PrintActive: unhandled layout!" );
                }
            }
            else {
                console.log( "No layout defined for active panel in cardpanel!" );
            }
        }
    }
);