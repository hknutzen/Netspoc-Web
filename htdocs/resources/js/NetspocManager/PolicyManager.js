
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.PolicyManager
 * @extends Ext.Panel
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype policymanager
 **/

NetspocManager.PolicyManager = Ext.extend(Ext.Panel, {
    layout        : 'border',
    border        : false,
    msgs          : {
        loginRequired : 'Login required!'
    },
    initComponent : function() {
        this.items =  [
            this.buildPolicyList(),
            this.buildPolicyDetailsView()
//            this.buildPolicyDetailsDV(),
//            this.buildPolicyRulesDV()
        ];

        NetspocManager.PolicyManager.superclass.initComponent.call(this);
    },

    buildPolicyList : function() {
        return {
            xtype     : 'policylist',
            itemId    : 'policyListId',
            flex      : 1,
            split     : true,
            resizable : true,
            region    : 'west',
            width     : 300,
            border    : false,
            listeners : {
                scope : this,
                click : this.onPolicyListClick
            }
        };
    },

    buildPolicyDetailsView : function() {
        return {
	    id     : 'pCenterId',
	    region : 'center',
	    xtype  : 'container',
	    layout : 'fit',
	    items  : [
		{
		    xtype     : 'tabpanel',
		    activeTab : 0,
		    items     : [
			{
			    title  : 'Details des '
				+ 'ausgew&auml;hlten'
				+ ' Diensts',
			    xtype  : 'panel',
			    layout : 'anchor',
			    autoScroll : true,
			    items  : [
//				this.buildPolicyDetailsDV(),
//				this.buildPolicyRulesDV(),
			    ]
			},
			{
			    title  : 'IP-Adressen hinter User',
			    xtype  : 'panel',
			    layout : 'fit',
			    items  : [
//				this.buildUserDetailsDV(),
			    ]
			}
		    ]
		}
	    ]
        };
    },

    onPolicyListClick : function() {
        var selectedPolicy =
               this.getComponent('policyListId').getSelected();
	console.log( "Selected: " + selectetPolicy );
	// Now load the stores of policy-details-dataview and
	// of policy-rules-dataview.
//      this.getComponent('departmentForm').loadData(selectedDepartment.data);
    }

});

Ext.reg('policymanager', NetspocManager.PolicyManager);