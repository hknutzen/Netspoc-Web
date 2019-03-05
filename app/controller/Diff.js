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
                    store.getProxy().extraParams.active_owner =
                        appstate.getOwner();
                    store.getProxy().extraParams.history =
                        appstate.getHistory();
                },
                this
            );
            diff_store.on(
                'load',
                function ( store, records, success, op, node, eOpts ) {
                    node.eachChild( store.rename, store );
                    // Expand recursively
                    node.set( 'text', (node.firstChild ? '' : 'keine ') +
                                  'Unterschiede' );
                    var tree = this.getDiffView();
                    tree.expandAll();
                },
                this
            );
            appstate.addListener(
                'changed', 
                function () {
                    if ( appstate.getInitPhase() ) { return; }
                    var cardpanel = this.getMainCardPanel();
                    var index = cardpanel.getLayout().getActiveItemIndex();
                    if ( index === 2 ) {
                        // Clear tree so no obsolete data is displayed.
                        this.getDiffView().getRootNode().removeAll();

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

        onSelectDiffPolicy : function( combo, record ) {
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
                store.load();
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