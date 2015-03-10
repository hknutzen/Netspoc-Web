StartTest(
    function(t) {
        
        t.requireOk(
            'PolicyWeb.model.AllOwners',
            function() {
                var data = {
                    owners : [
                        {
                            name  : 'LNSH-Policy',
                            alias : 'LNSH'
                        }
                    ]
                };
                var store = Ext.create(
                    'PolicyWeb.store.AllOwners', {
                        model : 'PolicyWeb.model.AllOwners',
                        data  : data,
                        proxy : {
                            type: 'memory',
                            reader: {
                                type : 'json',
                                root : 'owners'
                            }
                        }
                    }
                );
                store.on(
                    'load',
                    function() {
                        var mod_array = this.getRange();
                        var model = mod_array[0];
                        t.is(model.get('name') , 'LNSH-Policy',
                             'Can get model name.');
                        t.is(model.get('alias'), 'LNSH',
                             'Can get alias.');
                        
                    }
                );
                store.load();

                data = {
                    owners : [
                        {
                            name  : 'LNSH-Policy',
                            alias : ''
                        }
                    ]
                };
                store = Ext.create(
                    'PolicyWeb.store.AllOwners', {
                        model : 'PolicyWeb.model.AllOwners',
                        data  : data,
                        proxy : {
                            type: 'memory',
                            reader: {
                                type : 'json',
                                root : 'owners'
                            }
                        }
                    }
                );
                store.on(
                    'load',
                    function() {
                        var mod_array = this.getRange();
                        var model = mod_array[0];
                        t.is(model.get('alias'), 'LNSH-Policy',
                             'Fallback to "name" for empty "alias" is working.');
                        
                    }
                );
                store.load();
            }
        );
    }
);
