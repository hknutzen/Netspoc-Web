
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
