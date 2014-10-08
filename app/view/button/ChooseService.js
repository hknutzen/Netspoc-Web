
/*
A class that merely serves the purpose of identifying buttons
derived from this class (needed for common click event listener).

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
    'PolicyWeb.view.button.ChooseService',
    {
        extend  : 'Ext.button.Button',
        alias   : 'widget.chooseservice',
        tooltip : 'Wählen Sie die Art der Dienste, die angezeigt werden sollen'
    }
);