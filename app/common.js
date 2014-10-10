/*
(C) 2014 by Daniel Brunkhorst <daniel.brunkhorst@web.de>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp */)
  {
    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
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
    var rex = /[a-zA-Z]/;
    var d;
    var max;
    if ( rex.test(dot) === true ) {
        max = ((((((255)*256)+(255))*256)+(255))*256)+(255);
        return max;
    }
    else {
        d = dot.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    }
}

function numeric2ip( num ) {
    var rex = /[a-zA-Z]/;
    var d = num%256;
    var max;
    if ( rex.test(num) === true ) {
        max = ((((((255)*256)+(255))*256)+(255))*256)+(255);
        return max;
    }
    else {
        for (var i = 3; i > 0; i--) {
            num = Math.floor(num/256);
            d = num%256 + '.' + d;
        }
        return d;
    }
}

var specialchar2normalchar = {
    'Ä' : 'A',
    'Ö' : 'O',
    'Ü' : 'U',
    'ä' : 'a',
    'ö' : 'o',
    'ü' : 'u',
    'ß' : 'ss'
};
function germanize(s) {
    var ret;
    var first_char = s.substring(0,1);
    if ( first_char in specialchar2normalchar ) {
        ret = specialchar2normalchar[first_char] +
            '_' + s.substring(1);
    }
    else {
        ret = s;
    }
    return ret;
}

function record_names_as_csv( records ) {
    var selected = [];
    Ext.each( records, function (item) {
                  selected.push( item.data.name );
              }
            );
    return selected.join( ',');
}

