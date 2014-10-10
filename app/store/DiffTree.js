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
    'PolicyWeb.store.DiffTree', {
        extend      : 'Ext.data.TreeStore',
        alias       : 'store.difftreestore',
        autoLoad    : false,
        // Send  value of 'id' of root node as parameter 'version'.
        nodeParam   : 'version',
        translation : {
            'service_lists owner' : 'Liste eigener Dienste',
            'service_lists user'  : 'Liste genutzter Dienste',
            'objects'             : 'Objekte',
            'services'            : 'Dienste',
            'users'               : 'Liste der Benutzer (User)'
        },
        rename : function (child) {
            var txt = child.raw.text;
            var out = this.translation[txt];
            if ( out ) {
                child.set( 'text', out );
            }
        },
        root            : {
            text : 'Bitte Stand auswählen in "Vergleiche mit".',
            id   : 'none'
        },
        proxy  : {
            type    : 'ajax',
            noCache : false,
            url     : 'backend/get_diff'
        }
    }
);

