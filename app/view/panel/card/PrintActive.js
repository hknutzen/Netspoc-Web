
/*
A class that configures a card-panel to have a printable
currently active view.

(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

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