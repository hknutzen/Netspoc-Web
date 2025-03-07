/*
(C) 2025 by Daniel Brunkhorst <daniel.brunkhorst@posteo.de>
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

// bold_user is defined in common.js, since it is used in
// Rule.js, too (follow DRY principle).
Ext.define(
    'PolicyWeb.model.AllService',
    {
        extend: 'PolicyWeb.model.Netspoc',
        fields: [
            { name: 'service' },
            { name: 'action' },
            {
                name: 'src',
                mapping: function (node) {
                    return bold_user(node, 'src');
                }
            },
            {
                name: 'dst',
                mapping: function (node) {
                    return bold_user(node, 'dst');
                }
            },
            {
                name: 'prt',
            },
            {
                name: 'proto'
            }
        ]
    }
);
