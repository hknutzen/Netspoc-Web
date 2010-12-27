
function proxy4path ( path ) {
    return new Ext.data.HttpProxy(
	{
	    url : '/netspoc/' + path
	}
    );
}

