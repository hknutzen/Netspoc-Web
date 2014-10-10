
/*
A base class that contains the reusable bits of configuration
for Grids.

(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>
            Heinz Knutzen     <heinz.knutzen@gmail.com>

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
    'PolicyWeb.view.panel.grid.Abstract',
    {
        extend : 'Ext.grid.Panel',
        alias  : 'widget.abstractgrid',
        
        initComponent : function() {
            Ext.apply(
                this, {
                    forceFit    : true,
                    selModel    : this.buildSelModel(),
                    viewConfig  : this.buildViewConfig(),
                    defaults    : this.buildDefaults()
                }
            );
            this.callParent(arguments);
        },
        
        buildSelModel : function() {
            return {
                type : 'rowmodel',
                mode : 'SINGLE'
            };
        },

        buildDefaults : function() {
            return {
                menuDisabled : true
            };
        },

        buildViewConfig : function() {
            return {
                selectedRowClass : 'x-grid3-row-over',
                loadMask         : false
            };
        },

        printview : function() {
            Ext.ux.grid.Printer.print( this );
        },

        select0 : function() {
            if ( this.getStore().getCount() > 0 ) {
                var selmodel = this.getSelectionModel();
                selmodel.select(0);
            }
        }
    }
);
