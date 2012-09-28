
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
        }
    }
);

Ext.reg( 'emaillist', NetspocWeb.listpanel.EmailList );

