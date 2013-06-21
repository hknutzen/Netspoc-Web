
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
                        check : this.onDiffMailCheck
                    }
                }
            );
        },

	onLaunch : function() {
            var diff_get_store = this.getDiffGetMailStore();
            var diff_set_store = this.getDiffSetMailStore();
            //FOO
            diff_get_store.on( 'load',
                      function ( foo, bar, baz ) {
                          debugger;
/*
                          var result = records[0].get('send');
                          checkbox.setValue(result);
                          checkbox.send_event = true;
*/
                      },
                      this
                    );
            //diff_get_store.load();
            console.dir( diff_get_store.getProxy().extraParams );
        },

        onDiffMailCheck : function( a, b, c) {
            var checkbox = this.getDiffMailCheckbox();
            // Don't handle initial event from setValue above.
            if (! checkbox.send_event ) {
                return;
            }
            var store = Ext.create(
                'PolicyWeb.store.DiffSetMail'
            );
            store.load({ params : { send : checked } });
        }
    }
);