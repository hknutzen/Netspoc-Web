
Ext.define(
    'PolicyWeb.view.panel.grid.Emails',
    {
        extend      : 'Ext.grid.Panel',
        alias       : 'widget.emaillist',
        controllers : [ 'Service' ],
        store       : 'Emails',
        forceFit    : true,
        flex        : 1,
        border      : false,
        hideHeaders : true,
        title       : 'Verantwortliche',
        collapsible : true,
        split       : true,
        height      : 68,
         columns     : [
            {
                dataIndex : 'email'
            }
        ],
        viewConfig : {
            selectedRowClass : 'x-grid3-row-over'
        },
        defaults : {
            menuDisabled : true
        },
        show : function(owner, alias) {
            if (! owner) {
                this.clear();
                return;
            }
            var store        = this.getStore();
            var active_owner = appstate.getOwner();
            var history      = appstate.getHistory();
            var lastOptions  = store.lastOptions;
            if ( lastOptions  &&
                 lastOptions.params  &&
                 lastOptions.params.owner === owner  &&
                 lastOptions.params.history === history  &&
                 lastOptions.params.active_owner === active_owner  &&
                 store.getCount() // Reload if data was removed previously.
               ) 
            {
                return;
            }
            store.load ({ params : { owner : owner } });
            this.setTitle('Verantwortliche f&uuml;r ' + alias);
        },

        clear : function() {
            this.setTitle('');
            this.getStore().removeAll();
        }
    }
);

