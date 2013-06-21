
Ext.define(
    'PolicyWeb.controller.Diff', {
        extend : 'Ext.app.Controller',
        stores : [ 'DiffGetMail', 'DiffSetMail' ],
        refs   : [
            {
                selector : 'historycombo',
                ref      : 'historyCombo'
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
                        change : this.onDiffMailCheck
                    }
                }
            );
        },

	onLaunch : function() {
            var diff_get_store = this.getDiffGetMailStore();
            var diff_set_store = this.getDiffSetMailStore();
            diff_get_store.on( 'load',
                      function ( store, records ) {
                          var result = records[0].get('send');
                          var checkbox = this.getDiffMailCheckbox();
                          checkbox.setValue(result);
                      },
                      this
                    );
        },

        onDiffMailCheck : function( checkbox, new_val, old_val ) {
            var store = Ext.create(
                'PolicyWeb.store.DiffSetMail'
            );
            store.load({ params : { send : new_val } });
        }
    }
);