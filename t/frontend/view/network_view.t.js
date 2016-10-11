StartTest(
    function(t) {

        t.requireOk(
            [
                'PolicyWeb.proxy.Custom',
                'PolicyWeb.model.Network',
                'PolicyWeb.store.Netspoc', 
                'PolicyWeb.store.NetspocState', 
                'PolicyWeb.store.Networks',
                'PolicyWeb.view.panel.grid.Networks'
            ], 
            function() {
                var grid;
                var store = Ext.create(
                    'PolicyWeb.store.Networks'
                );

                store.on(
                    'load',
                    function() {
                        grid = Ext.create(
                            'PolicyWeb.view.panel.grid.Networks', {
                                renderTo : Ext.getBody(),
                                store    : store,
                                height   : 200,
                                width    : 300
                            }
                        );
                    }
                );
                store.load(
                    {
                        params : {
                            active_owner : 'x',
                            history      : 'p1'
                        }
                    }
                    );

                t.waitForRowsVisible(
                    grid,
                    function() {
                        t.is( grid.store.getCount(),
                              grid.getView().getNodes().length,
                              'Alle Daten aus store gerendert.');
                        t.matchGridCellContent(
                            grid, 0, 0,
                            grid.store.first().get( 'ip' ),
                            'Daten aus Grid stimmen mit Store-Daten überein.'
                        );
                    }
                );
            }
        );
    }
);
