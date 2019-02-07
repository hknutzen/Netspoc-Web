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
    'PolicyWeb.model.User',
    {
        extend : 'PolicyWeb.model.Base',
        fields : [
            { name     : 'name'  , 
              header   : 'Name'
            },
            { name     : 'ip',
              header   : 'IP-Adressen',
              width    : 0.25,
              sortType : 'asIP'
            },
            // Not shown, but needed to select the corresponding
            // email addresses.
            { name    : 'owner', 
              header  : 'Verantwortungsbereich',
              width   : 0.25
            }
        ],
        proxy : {
            url : 'backend/get_users'
        }
    }
);

