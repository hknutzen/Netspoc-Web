
Ext.ns("NetspocManager");

/**
 * @class NetspocManager.WorkflowManager
 * @extends Ext.Container
 * NEEDS A DESCRIPTION
 * <br />
 * @constructor
 * @param {Object} config The config object
 * @xtype workflowmanager
 **/


var up_tree_collapsed = true;
var name_or_ip = 'name';
var add2user_store;
var summary = {};
var stree = {};

NetspocManager.WorkflowManager = Ext.extend(
    Ext.Container,
    {
        border : true,
        layout : 'fit',
        margins : 50,

        initComponent : function() {
            // Reset summary.
            add2user_store = new Ext.data.JsonStore(
                {
                    // store configs
                    autoDestroy : true,
                    storeId     : 'add2userStoreId',
                    // reader configs
                    root        : 'records',
                    idProperty  : 'name',
                    fields      : [ 'name', 'objects' ]
                }
            );

            this.items = [
                this.buildTabPanel()
            ];
            
            NetspocManager.WorkflowManager.superclass.initComponent.call(this);

            var appstate = NetspocManager.appstate;
            appstate.addListener(
                'changed', 
                function () {
                    var tabp = rg.findParentByType( 'tabpanel' );
                    var tp   = tabp.findByType( 'treepanel' )[0];
                    var root = tp.getRootNode();
                    var loader = tp.getLoader();
                    loader.load( root );
                    // Only direct childs, no animation.
                    root.collapse( false, false );
                    root.setText('Netze');
                    root.expand();
                },
                this
            );
        },
        
        buildTabPanel : function () {
            var tabpanel = new Ext.TabPanel(
                {
                    activeTab : 0,
                    items     : [
                        {
                            title  : 'Genutzten Dienst ändern',
                            layout : 'border',
                            items  : [
                                this.buildNetworkTree(),
                                this.buildUsedPolicyList()
                            ]
                        },
/*
                        {
                            title  : 'Eigenen Dienst ändern',
                            layout : 'hbox',
                            align  : 'stretch',
                            items  : [
                                //this.buildNetworkTree(),
                                //this.buildOwnPolicyList()
                            ]
                        },
*/
                        {
                            title     : 'Zusammenfassung/Auftrag bestätigen',
                            listeners : {
                                activate : function ( panel ) {
                                    var wf = panel.findParentByType( 'workflowmanager' );
                                    wf.buildSummaryPanel( panel );
                                }
                            }
                        }
                    ],
                    listeners : {
                        afterrender : function ( me ) {
                            var tp = me.findByType( 'treepanel' );
                            tp[0].getRootNode().expand();
                        }
                    }
                }
            );

            return tabpanel;
        },

        buildSummaryPanel : function ( panel ) {
            var tree = new Ext.tree.TreePanel( 
                {
                    useArrows       : true,
                    autoScroll      : true,
                    animate         : false,
                    containerScroll : true,
                    border          : false,
                    root : {
                        id        : 'add2userTreeId',
                        text      : 'Hinzuzufügende Objekte',
                        draggable : false
                    },
                    children : [ stree ]
                }
            );
            panel.removeAll();
            panel.add( tree );
            panel.doLayout();
        },

        buildNetworkTree : function () {
            
            var radiogroup = {
                xtype : 'radiogroup',
                width : 160,
                items : [
                    {
                        boxLabel   : 'Namen',
                        name       : 'rbg',
                        value      : 'name',
                        checked    : true
                    },
                    {
                        boxLabel   : 'IP-Adressen',
                        name       : 'rbg',
                        value      : 'ip'
                    }
                ],
                listeners : {
                    change : function( rg, checked  ) {
                        name_or_ip = checked.value;
                        var tabp   = rg.findParentByType( 'tabpanel' );
                        var tp     = tabp.findByType( 'treepanel' )[0];
                        var loader = tp.getLoader();
                        var root   = tp.getRootNode();
                        loader.load( root );
                        root.expand();
                    }
                }
            };
            var tree = new Ext.tree.TreePanel( 
                {
                    region          : 'center',
                    useArrows       : true,
                    autoScroll      : true,
                    animate         : false,
                    containerScroll : true,
                    border          : false,
                    enableDrag      : true,
                    loader          : {
                        dataUrl   : 'backend/get_net_tree',
                        listeners : {
                            beforeload : function( loader, node ) {
                                var appstate     = NetspocManager.appstate;
                                var active_owner = appstate.getOwner();
                                var history      = appstate.getHistory();
                                loader.baseParams.active_owner = active_owner;
                                loader.baseParams.history      = history;
                                loader.baseParams.display      = name_or_ip;
                            }
                        }
                    },
                    listeners : {
                        afterrender : function( t ) {
                            //console.log( t.dragZone );
                        }
                    },
                    root : {
                        id        : 'networksTreeId',
                        text      : 'Netze',
                        draggable : false
                    },
                    tbar :  [
                        radiogroup,
                        {
                            text         : '| Alles Aus-/Einklappen |',
                            enableToggle : true,
                            handler      : function ( button, event ) {
                                var tp   = button.findParentByType( 'treepanel' );
                                var root = tp.getRootNode();
                                if ( up_tree_collapsed ) {
                                    root.expand( true );
                                    up_tree_collapsed = false;
                                }
                                else {
                                    root.collapse( true );
                                    root.expand();
                                    up_tree_collapsed = true;
                                }
                            }           
                        }
                    ]
                }
            );

            return tree;
        },

        buildUsedPolicyList : function () {

            var store = {
                xtype         : 'netspocstatestore',
                proxyurl      : 'service_list',
                doReload      : 1,
                sortInfo      : { field: 'name', direction: "ASC" },
                fields        : [
                    { name : 'name',  mapping : 'name'         }
                ]
            };

            var colModel = new Ext.grid.ColumnModel(
                {
                    columns    : [
                        {
                            dataIndex : 'name'
                        }
                    ],
                    defaults : {
                        menuDisabled : true
                    }
                }
            );

            var grid = new Ext.grid.GridPanel(
                {
                    region     : 'east',
                    store      : store,
                    stripeRows : true,
                    split      : true,
                    border     : false,
                    width      : 600,
                    viewConfig : {
                        forceFit         : true,
                        selectedRowClass : 'x-grid3-row-over'
                    },
                    colModel   : colModel,
                    listeners  : {
                        beforerender : function( me ) {
                            var params = { relation : 'user' };
                            me.getStore().load( { params : params } );
                        },
                        afterrender : function() {
                            grid.dropZone = new Ext.dd.DropZone(
                                grid.getView().scroller,
                                {
                                    ddGroup : 'TreeDD',

                                    // If the mouse is over a grid row, return that node. This is
                                    // provided as the "target" parameter in all "onNodeXXXX"
                                    // node event handling functions
                                    getTargetFromEvent: function( e ) {
                                        return e.getTarget( grid.getView().rowSelector );
                                    },
                                    
                                    // On entry into a target node, highlight that node.
                                    onNodeEnter : function( target, dd, e, data ) { 
                                        Ext.fly(target).addClass( '.x-ie-shadow' );
                                    },
                                    
                                    // On exit from a target node, unhighlight that node.
                                    onNodeOut : function( target, dd, e, data ) { 
                                        Ext.fly(target).removeClass( '.x-ie-shadow' );
                                    },
                                    
                                    // While over a target node, return the default drop
                                    // allowed class which places a "tick" icon into
                                    // the drag proxy.
                                    onNodeOver : function( target, dd, e, data ) { 
                                        return Ext.dd.DropZone.prototype.dropAllowed;
                                    },
                                    
                                    // On node drop we can interrogate the target to find
                                    // the underlying application object that is the real
                                    // target of the dragged data.
                                    // In this case, it is a Record in the GridPanel's Store.
                                    onNodeDrop : function( target, dd, e, data ) {
                                        var rowIndex = grid.getView().findRowIndex( target );
                                        var row = grid.getStore().getAt( rowIndex );
                                        var add = data.node.attributes.text;
                                        if ( row ) {
                                            var text = '<center>Für einen Überblick über die  ' + 
                                                'beauftragten Änderungen und für eine ' +
                                                'Bestätigung des Auftrags, siehe ' +
                                                'Karteireiter "Zusammenfassung" </center>';
                                            var srv = row.get( 'name' );
/*
                                            Ext.Msg.alert( 'Änderungsauftrag hinzugefügt',
                                                           '<center><br>Hinzufügen der Resource "' +
                                                            + add + '" zum Dienst "' +  srv +
                                                           '" wird beauftragt.</center> <br><br>' +
                                                           text
                                                         );
*/
                                            if ( stree[srv] ) {
                                                var entry = stree[srv];
                                                //console.dir( entry );
                                                entry.children.push( add );
                                            }
                                            else {
                                                stree[srv] = 
                                                    {
                                                        text     : srv,
                                                        children : [ add ]
                                                    };
                                            }
                                            console.dir( stree );
                                            return true;
                                        }
                                        else {
                                            return false;
                                        }
                                    }
                                }
                            );
                        }
                    },
                    tbar : [
                        {},  // empty panel as placeholder
                        {
                            xtype : 'label',
                            text  : 'Dienstname'
                        }
                    ]
                }
            );
            return grid;
        },
        
        buildOwnPolicyList : function () {
            var plv = {
                xtype      : 'policylist',
                proxyurl   : 'service_list',
                enableDrop : true,
                listeners  : {
                    beforerender: function( list ) {
                        list.loadStoreByParams( { relation : 'owner' } );
                    }
                }
            };
            return plv;
        }
    }
);

Ext.reg( 'workflowmanager', NetspocManager.WorkflowManager );
