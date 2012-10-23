
Ext.ns("NetspocWeb.listpanel");

/**
 * @class NetspocWeb.listpanel.EmailList
 * @extends NetspocWeb.listpanel.ListPanelBaseCls
 * A configuration instance of {@link NetspocWeb.listpanel.ListPanelBaseCls}
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

NetspocWeb.listpanel.EmailList = Ext.extend(
    NetspocWeb.listpanel.Simple, {
	initComponent : function() {
            Ext.apply(this, 
                  {
                      proxyurl    : 'get_emails',
	              sortInfo    : { field: 'email', direction: "ASC" },
                      hideHeaders : true,
	              fieldsInfo  : [
	                  { name : 'email', header : 'Verantwortliche' }
	              ]
                  }
                 );
            NetspocWeb.listpanel.EmailList.
                superclass.initComponent.call(this);
        },
        show : function(owner, alias) {
            if (! owner) {
                this.clear();
                return;
            }
            var store        = this.getStore();
            var appstate     = NetspocManager.appstate;
            var active_owner = appstate.getOwner();
            var history      = appstate.getHistory();
            var lastOptions  = store.lastOptions;
            if ( lastOptions 
                 && lastOptions.params
                 && lastOptions.params.owner === owner
                 && lastOptions.params.history === history
                 && lastOptions.params.active_owner === active_owner
                 // Reload if data was removed previously.
                 && store.getCount()) 
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

Ext.reg( 'emaillist', NetspocWeb.listpanel.EmailList );

