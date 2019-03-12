/*
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
    'PolicyWeb.store.Netspoc', {
        extend      : 'Ext.data.Store',
        model       : 'PolicyWeb.model.Base',
        alias       : 'store.netspocstore',
        autoLoad    : false,
        constructor : function() {
            this.callParent( arguments );

            this.addListener('beforeload', function ( store, options ) {
                                 Ext.getBody().mask('Daten werden geladen ...', 
                                                    'x-mask-loading');
                                 return true;                   
                             }
                            );
            this.addListener('load', function() { 
                                 Ext.getBody().unmask();
                                 this.isLoaded = true;
                             }
                            );
        }
    }
);

