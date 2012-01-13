
function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : '/netspoc/' + path
	}
    );
}

function trim( str ) {
    return str.replace(/^\s+|\s+$/g,"");
}

function captureEvents(observable) {
    Ext.util.Observable.capture(
        observable,
        function(eventName) {
            console.info(eventName);
        },
        this
    );		
}

function ip2numeric( dot ) {
    var d = dot.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}

function numerip2ip( num ) {
    var d = num%256;
    for (var i = 3; i > 0; i--) {
	num = Math.floor(num/256);
	d = num%256 + '.' + d;
    }
    return d;
}