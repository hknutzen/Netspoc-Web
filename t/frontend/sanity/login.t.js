StartTest(function(t) {
    // Running in the 'top' page scope. Get the local variables from the test.
    var Ext         = t.Ext();
    var window      = t.global;
    var document    = window.document;
    
    t.chain(
        { type : "guest", target : '>> #links textfield[fieldLabel=email]' }, 
        { type : "", target : '>> #links textfield[fieldLabel=pass]' },

//        NOTE, that this code won't work (or will work unreliably, as it contains race condition):
//            { click : '>> #loginPanel button' },
//            { waitFor : 'PageLoad'}
//        It is because in Chrome page refresh may happen too fast (may be even synchronously), 
//        and by the time the "waitForPageLoad" action will start, the page load event will already happen. 
//        Because of that `waitForPageLoad` will wait indefinitely.
//        Need to start waiting first, and only then - click, we'll use "trigger" config of the `wait` action for that
        
        {
            waitFor     : 'PageLoad',
            trigger     : {
                click : '>> #links button'
            }
        },
       
        function (next, window, Ext) {
            var panel   = Ext.getCmp('authResult')
                
            t.is(panel.authResult, 'success', 'Correct authentication result');
            
            t.done();
        }
    )
})    
