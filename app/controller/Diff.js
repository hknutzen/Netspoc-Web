
Ext.define(
    'PolicyWeb.controller.Diff', {
        extend : 'Ext.app.Controller',
        stores : [ 'DiffGetMail', 'DiffTree' ],
        refs   : [
            {
                selector : 'mainview > panel',
                ref      : 'mainCardPanel'
            },
            {
                selector : 'diffview',
                ref      : 'diffView'
            },
            {
                selector : 'diffview historycombo',
                ref      : 'diffHistoryCombo'   
            },
            {
                selector : 'mainview historycombo',
                ref      : 'mainHistoryCombo'   
            },
            {
                selector : 'diffview checkbox',
                ref      : 'diffMailCheckbox'
            }
        ],

        init : function() {
            
            this.control(
                {
                    'diffview checkbox': {
                        change : this.onDiffMailChange
                    },
                    'diffview' : {
                        beforeactivate : this.onBeforeActivate
                    },
                    'diffview historycombo': {
                        beforequery : this.onBeforeQuery,
                        select      : this.onSelectDiffPolicy
                    }
                }
            );
        },

	onLaunch : function() {
            // Event handlers for Diff checkbox store.
            var diff_get_store = this.getDiffGetMailStore();
            diff_get_store.on( 'load',
                      function ( store, records ) {
                          var result = records[0].get('send');
                          var checkbox = this.getDiffMailCheckbox();
                          checkbox.setValue(result);
                      },
                      this
                    );

            // Event handlers for Diff tree store.
            var diff_store = this.getDiffTreeStore();
            diff_store.on(
                'beforeload',
                function ( store, operation ) {
                    store.getProxy().extraParams.active_owner = appstate.getOwner();
                    store.getProxy().extraParams.history      = appstate.getHistory();
                },
                this
            );
            diff_store.on(
                'load',
                function ( store, node ) {
                    node.eachChild( store.rename, store );
                    // Expand recursively
                    node.expandChildren( true );
                    node.set( 'text', (node.firstChild ? '' : 'keine ') +
                                  'Unterschiede' );
                },
                this
            );
            appstate.addListener(
                'changed', 
                function () {
                    if ( appstate.getInitPhase() ) { return; };
                    var cardpanel = this.getMainCardPanel();
                    var index = cardpanel.getLayout().getActiveItemIndex();
                    if ( index === 2 ) {
                        this.onBeforeActivate();
                    }
                },
                this
            );
        },

	onBeforeActivate : function() {
            var tree  = this.getDiffView();
            var combo = this.getDiffHistoryCombo();
            var node;
            if (! tree.rendered) {
                return;
            }
            node = tree.getRootNode();
            // Only direct childs, no animation.
            node.collapse(false, false);
            node.set( 'text', 'Bitte Stand auswählen in "Vergleiche mit".' );
            node.setId('none');
            combo.setValue('');
            this.getDiffGetMailStore().load();
        },

        onSelectDiffPolicy : function( combo, records ) {
            var record  = records[0];
            var tree    = this.getDiffView();
            var version = record.get('date');
            var node    = tree.getRootNode();
            var store   = this.getDiffTreeStore();
            combo.setValue(version);
            node.setId(version);
            store.load();
            if ( node.isLoaded() ) {
                tree.getView().refresh();
            }
            node.expand();
        },

        onBeforeQuery : function( qe ) {
            var policy = appstate.getPolicy();
            // Skip first character "p".
            var pnum = policy.slice(1);
            var filter = function(record, id) {
                var pnum2 = record.get('policy').slice(1);
                return (pnum2 < pnum);
            }; 
            var store = qe.combo.getStore();

            // If store has never been loaded or
            // records have been removed, then load store.
            if (store.needLoad) {
                delete qe.combo.lastQuery;
                store.needLoad = false;
                store.on('load', 
                         function () {
                             store.filterBy(filter);
                         },
                         this,
                         { single : true });
            }
            else {
                store.filterBy(filter);
            }
        },
        
        onDiffMailChange : function( checkbox, new_val, old_val ) {
            var store = Ext.create(
                'PolicyWeb.store.DiffSetMail'
            );
            store.load({ params : { send : new_val } });
        }
    }
);