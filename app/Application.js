
// Main file that launches application.

// Needed for dynamic loading to work.
Ext.require('Ext.container.Viewport');
Ext.Loader.setConfig({enabled:true});

var appstate = function () {
    var owner, owner_alias, history, networks = '';
    var state = new Ext.util.Observable();
    state.addEvents('changed', 'ownerChanged', 'networksChanged');
    state.changeOwner = function (name, alias, silent) {
        owner_alias = alias;
        if (name !== owner) {
            owner = name;
            if (! silent) {
                state.fireEvent('changed');
                state.fireEvent('ownerChanged');
            }
        }
    };
};

Ext.application(
    {
	name               : 'PolicyWeb',
	autoCreateViewport : true,
	models             : [ 'Policy' ],
	stores             : [ 'Policy', 'NetspocState' ],
	controllers        : [  ],
	launch             : function() {
            PolicyWeb.app = this;   // get reference to app instance. IMPORTANT!
        },
        globals            : {
            appstate : appstate
        }
    }
);

