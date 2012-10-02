
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.AccountManager
 * @extends Ext.Container
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype accountmanager
 **/

NetspocManager.AccountManager = Ext.extend(
    Ext.Container,
    {
        border  : false,
        layout  : {
            type  : 'hbox',
            align : 'stretch'
        },

        initComponent : function() {
            this.items =  [
                this.buildAdminListPanel(),
                this.buildWatcherListPanel(),
                this.buildSupervisorListPanel(),
                this.buildSupervisorEmailsListpanel()
            ];
            
            NetspocManager.AccountManager.
		superclass.initComponent.call(this);

            this.items.each(function (item, index, length) {
                if(item.doReload) {
                    item.getStore().load();
                }
            });
        },

        buildAdminListPanel : function() {
            return {
                xtype    : 'emaillist',
		doReload : true,
                flex     : 1,
                title    : 'Verantwortliche'
            };
        },

        buildWatcherListPanel : function() {
            return {
                xtype       : 'simplelist',
                proxyurl    : 'get_watchers',
                hideHeaders : true,
                fieldsInfo  : [ { name : 'email', header : 'x' } ],
                doReload    : true,
                flex        : 1,
                title       : 'Zuschauer (Watcher)'
            };
        },

        buildSupervisorListPanel : function() {
            return {
                xtype       : 'simplelist',
                proxyurl    : 'get_supervisors',
                autoSelect  : 'true',
                hideHeaders : true,
                fieldsInfo  : [ 
                    { 
                        name : 'alias', 
                        header : 'x',
                        mapping : function(node) { 
                            return node.alias || node.name;
                        }
                    },
                    { name : 'name' }
                ],
                doReload    : true,
                flex        : 1,
                title       : 'Übergeordnet',
                listeners : {
                    scope : this,
                    selectionchange : function(dv, selections) {
                        if(! selections.length) {
                            return; 
                        }
                        var selected = dv.getRecord(selections[0]);
                        var emailPanel = this.findById('SupervisorEmails');
                        if(selected) {
                            emailPanel.show(selected.get('name'),
                                            selected.get('alias') );
                        }
                        else {
                            emailPanel.clear();
                        }
                    }
                }
            };
        },

        buildSupervisorEmailsListpanel : function() {
            return {
                xtype       : 'emaillist',
                title       : ' ',
                id          : 'SupervisorEmails',
                flex        : 1,
            }
        }
    }
);
Ext.reg( 'accountmanager', NetspocManager.AccountManager );
