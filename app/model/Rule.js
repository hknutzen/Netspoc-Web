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

var as_ip = function(value){
    // Add sortType "asIP" that converts IP addresses to
    // a numerical value which makes them sortable.
    var m1 = /-/;
    var m2 = /\//;
    var array;
    if ( value.match(m1) ) {
        array = value.split('-');
        return ip2numeric( array[0] );
    }
    else if ( value.match(m2) ) {
        array = value.split('/');
        return ip2numeric( array[0] );
    }
    else {
        return ip2numeric( value );
    }
};

var bold_user = function ( node, what ) {
    var data = what === 'src' ?  node.src : node.dst;
    if ( node.has_user === what || node.has_user === 'both' ) {
        return '<span style="font-weight:bold;">User</span>';
    }
    else {
        var first = data[0];
        var m1 = /[A-Za-z]/;
        if (first.match(m1) ) {
            return data.sort(function (a, b) {
                                 return a.toLowerCase().localeCompare(b.toLowerCase());
                             }).join( '<br>' );
        }
        else {
            data.sort(
                function(a, b) {
                    return as_ip(a) - as_ip(b);
                }
            );
            return data.join('<br>');
        }
    }
};

Ext.define(
    'PolicyWeb.model.Rule',
    {
        extend : 'PolicyWeb.model.Netspoc',
        fields : [
            { name : 'has_user', mapping : 'hasuser'  },
            { name : 'action',   mapping : 'action'  },
            {
                name     : 'src',
                sortType : "asIP",
                mapping  : function( node ) {
                    return bold_user( node, 'src' );
                }
            },
            {
                name     : 'dst',
                sortType : "asIP",
                mapping  : function( node ) {
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

