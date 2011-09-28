
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

