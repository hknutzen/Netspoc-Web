StartTest(
    function(t) {

        t.requireOk(
            [
                'PolicyWeb.model.Network',
                'PolicyWeb.store.NetspocState', 
                'PolicyWeb.store.Networks',
                'PolicyWeb.view.panel.grid.Networks'
            ], 
            function() {
                console.log("HALLO?");
                var grid;
                var store = Ext.create(
                    'PolicyWeb.store.Networks'
                );
                console.log("WELT?");

                store.on(
                    'load',
                    function() {
                        alert("HERE!");
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
                store.load();

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
