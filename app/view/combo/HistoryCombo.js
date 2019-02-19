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
    'PolicyWeb.view.combo.HistoryCombo', {
        id             : 'list_diff_policies',
        extend         : 'Ext.form.field.ComboBox',
        alias          : 'widget.historycombo',
        store          : 'History',
        forceSelection : false,
        autoSelect     : true,
        editable       : false,
        allowblank     : false,
        displayField   : undefined,
        valueField     : undefined,
        loadingText    : 'Abfrage l&auml;uft ...',

	// Store is reloaded manually, when HistoryCombo is selected,
        // but isn't reloaded, when diffHistoryCombo is selected.
        queryMode      : 'local',

        // Is needed, for filterBy of diffHistoryCombo to work.
        lastQuery      : '',
        width          : 140,
        listConfig     : {
            minWidth : 200,
            itemTpl  : '{date} {time} ({policy})'
        }
    }
);
