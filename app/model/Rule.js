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

var bold_user = function ( node, what ) {
    if ( node.has_user === what || node.has_user === 'both' ) {
        return '<span style="font-weight:bold;"> User </span>';
    }
    else {
        return what === 'src' ?  node.src.join( '<br>' ) :
            node.dst.join( '<br>' );
    }
};

Ext.define(
    'PolicyWeb.model.Rule',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name : 'has_user', mapping : 'hasuser'  },
            { name : 'action',   mapping : 'action'  },
            { name : 'src',      mapping : function( node ) {
                  return bold_user( node, 'src' );
              }
            },
            { name : 'dst',      mapping : function( node ) {
                  return bold_user( node, 'dst' );
              }
            },
            { name : 'prt',      mapping : function( node ) {
                  return node.prt.join( '<br>' );
              }
            }
        ]
    }
);

