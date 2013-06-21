
Ext.define(
    'PolicyWeb.view.tree.Diff',
    {
        extend          : 'Ext.tree.Panel',
        alias           : 'widget.diffview',
        controllers     : [ 'Diff' ],
        useArrows       : true,
        autoScroll      : true,
        animate         : false,
        containerScroll : true,
        border          : false,
        loader          : {
            dataUrl  : 'backend/get_diff',
            
            // Send  value of 'id' of root node as parameter 'version'.
            nodeParameter : 'version',
            
            translation : {
                'service_lists owner' : 'Liste eigener Dienste',
                'service_lists user'  : 'Liste genutzter Dienste',
                'objects'             : 'Objekte',
                'services'            : 'Dienste',
                'users'               : 'Liste der Benutzer (User)'
            },
            rename : function (child) {
                var txt = child.text;
                var out = this.translation[txt];
                if (out) {
                    child.setText(out);
                }
            } 
        },
        
        root : {
            text: 'Bitte Stand auswählen in "Vergleiche mit".',
            id: 'none'
        },

        initComponent : function() {
            var checkbox = Ext.create(
                'Ext.form.field.Checkbox'
            );
            var combo = Ext.create(
                'PolicyWeb.view.combo.HistoryCombo'
            );
            this.tbar =  [ 'Vergleiche mit', 
                           combo,
                           ' ',
                           {
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
                         ],
            this.callParent(arguments);
        }
    }
);


