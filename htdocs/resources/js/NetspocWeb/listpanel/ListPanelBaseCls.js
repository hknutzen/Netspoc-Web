
Ext.ns('NetspocWeb.listpanel');

/**
 * @class NetspocWeb.listpanel.ListPanelBaseCls
 * @extends Ext.Panel
 * A base class that contains the reusable bits of configuration
 * for ListViews in a Panel.
 * It uses the {@link Ext.layout.FitLayout fit} layout to stretch
 * the instance.
 * <br />
 * @constructor
 * @param {Object} config The config object
 **/

NetspocWeb.listpanel.ListPanelBaseCls = Ext.extend(
    Ext.Panel, {
        layout  : 'fit',
        initComponent : function() {
            this.items = this.buildListView();
            
            NetspocWeb.listpanel.ListPanelBaseCls.
                superclass.initComponent.call(this);
            
            this.relayEvents(this.getView(), ['click', 'selectionchange']);
            this.relayEvents(this.getStore(), ['load']);
            this.addListener('beforerender',
                             function (me) {
                                 var store = this.getStore();
                                 if (store.doReload) {
                                     store.load();
                                 }
                                 return true;
                             },
                             this);
        },
        
        buildListView : function() {
            return {};
        },
        
        buildStore : function() {
            return { xtype    : 'netspocstore',
                     proxyurl : this.proxyurl };
        },

        printView : function() {
            var view  = this.getView();
            var title = view.title ? view.title + ' drucken': 'Drucken';
            var grid  = new Ext.grid.GridPanel(
                {
                    title   : title,
                    store   : view.store,
                    columns : view.columns
                }
            );
            Ext.ux.Printer.print( grid );
        },
        
        clearView : function() {
            this.getStore().removeAll();
        },
        
        createAndSelectRecord : function(o) {
            var view = this.getView();
            var record = new view.store.recordType(o);
            
            view.store.addSorted(record);
            
            var index = view.store.indexOf(record);
            view.select(index);
            
            return record;
        },
        
        clearSelections : function() {
            return this.getView().clearSelections();
        },
        getView : function() {
            return this.items.items[0];
        },
        
        getStore : function() {
            return this.getView().store;
        },
        
        getSelectedRecords : function() {
            return this.getView().getSelectedRecords();
        },
        getSelected : function() {
            return this.getSelectedRecords()[0];    
        },
        
        refreshView : function() {
            this.getView().store.reload();
        },
        
        selectById : function(id) {
            var view = this.getView();
            id = id || false;
            if (id) {
                var ind = view.store.find('id', id);
                view.select(ind);
            }
        },
        selectRow0 : function() {
            this.getView().select(0);
        },
        
        loadStoreByParams : function(params) {
            params = params || {};
            
            this.getStore().load({params:params});
        }
    }
);