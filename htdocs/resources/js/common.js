

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

function numeric2ip( num ) {
    var d = num%256;
    for (var i = 3; i > 0; i--) {
	num = Math.floor(num/256);
	d = num%256 + '.' + d;
    }
    return d;
}

function record_names_as_csv( records ) {
    var selected = [];
    Ext.each( records, function (item) {
		  selected.push( item.data.name );
	      }
	    );
    var record_names = selected.join( ',');
    return record_names;
}

