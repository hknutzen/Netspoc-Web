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
    'PolicyWeb.view.tree.Diff',
    {   
        id              : 'pnl_diff',
        extend          : 'Ext.tree.Panel',
        alias           : 'widget.diffview',
        controllers     : [ 'Diff' ],
        store           : 'DiffTree',
        useArrows       : true,
        autoScroll      : true,
        autoShow        : true,
        animate         : false,
        containerScroll : true,
        border          : false,

        initComponent : function() {
            var checkbox = Ext.create(
                'Ext.form.field.Checkbox'
            );
            var combo = Ext.create(
                'PolicyWeb.view.combo.HistoryCombo'
            );
            this.tbar = [
                'Vergleiche mit', 
                combo,
                ' ',
                {   
                    id                : 'btn_diff_tooltip',
                    xtype             : 'button',
                    text              : 'Diff per Mail senden',
                    handleMouseEvents : false,
                    tooltip           : 
                    'Vergleicht am Ende eines Tages' +
                        ' den aktuellen Stand ' +
                        ' mit dem Stand des Vortags' +
                        ' und sendet Ihnen bei Änderungen eine Mail.'
                },
                checkbox
            ];
            this.callParent(arguments);
        }
    }
);


