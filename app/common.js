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

if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun /*, thisp */) {
        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

function bold_user(node, what) {
    var data = what === 'src' ? node.src : node.dst;
    if (node.has_user === what || node.has_user === 'both') {
        return '<span style="font-weight:bold;">User</span>';
    }
    else {
        var first = data[0];
        if (first === undefined) {
            return '';
        }
        var m1 = /[A-Za-z]/;
        if (first.match(m1)) {
            return data.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }).join('<br>');
        }
        else {
            var copy = uniquify(data);
            if (copy === undefined || copy.length < 1) {
                return '';
            }
            copy.sort(
                function (a, b) {
                    return as_ip(a) - as_ip(b);
                }
            );
            return copy.join('<br>');
        }
    }
};

function trim(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

function captureEvents(observable) {
    Ext.util.Observable.capture(
        observable,
        function (eventName) {
            console.info(eventName);
        },
        this
    );
}

function uniquify(arr) {
    return arr.filter((e, i) => arr.indexOf(e) >= i)
}

// Return a numerical value for an IP, which makes them sortable.
// If a mask is present, just the numeric value of the network
// base address is returned.
// If it is a range, then the numerical value of the lower end
// of the range is returned.
function as_ip(value) {
    var m1 = /-/;
    var m2 = /\//;
    var array;
    if (value.match(m1)) {
        array = value.split('-');
        return ip2numeric(array[0]);
    }
    else if (value.match(m2)) {
        array = value.split('/');
        return ip2numeric(array[0]);
    }
    else {
        return ip2numeric(value);
    }
};

function ip2numeric(dot) {
    var rex = /[a-zA-Z]/;
    var d;
    var max;
    if (rex.test(dot) === true) {
        max = ((((((255) * 256) + (255)) * 256) + (255)) * 256) + (255);
        return max;
    }
    else {
        d = dot.split('.');
        return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
    }
}

function numeric2ip(num) {
    var rex = /[a-zA-Z]/;
    var d = num % 256;
    var max;
    if (rex.test(num) === true) {
        max = ((((((255) * 256) + (255)) * 256) + (255)) * 256) + (255);
        return max;
    }
    else {
        for (var i = 3; i > 0; i--) {
            num = Math.floor(num / 256);
            d = num % 256 + '.' + d;
        }
        return d;
    }
}

var specialchar2normalchar = {
    'Ä': 'A',
    'Ö': 'O',
    'Ü': 'U',
    'ä': 'a',
    'ö': 'o',
    'ü': 'u',
    'ß': 'ss'
};
function germanize(s) {
    var ret;
    var first_char = s.substring(0, 1);
    if (first_char in specialchar2normalchar) {
        ret = specialchar2normalchar[first_char] +
            '_' + s.substring(1);
    }
    else {
        ret = s;
    }
    return ret;
}

function record_names_as_csv(records) {
    var selected = [];
    Ext.each(records, function (item) {
        selected.push(item.data.name);
    }
    );
    return selected.join(',');
}


function get_store_feature(grid, featureFType) {
    var view = grid.getView();
    var features;

    if (view.features)
        features = view.features;
    else if (view.featuresMC)
        features = view.featuresMC.items;
    else if (view.normalView.featuresMC)
        features = view.normalView.featuresMC.items;

    if (features)
        for (var i = 0; i < features.length; i++) {
            if (featureFType == 'grouping')
                if (features[i].ftype == 'grouping' || features[i].ftype == 'groupingsummary')
                    return features[i];
            if (featureFType == 'groupingsummary')
                if (features[i].ftype == 'groupingsummary')
                    return features[i];
            if (featureFType == 'summary')
                if (features[i].ftype == 'summary')
                    return features[i];
        }
    return undefined;
}

function isIPv4Address(ip) {
    var blocks = ip.split(".");
    if (blocks.length === 4) {
        return blocks.every(
            function (block) {
                return !isNaN(block) && parseInt(block, 10) >= 0 && parseInt(block, 10) <= 255;
            }
        );
    }
    return false;
}

/**
 * Turn a Subnet Mask into a CIDR prefix
 */
function mask2cidr(subnet_mask) {
    var cidr_bits = 0;

    subnet_mask.split('.').forEach(
        function (octet) {
            cidr_bits += ((octet >>> 0).toString(2).match(/1/g) || []).length;
        }
    );
    return cidr_bits;
}

/**
 * Turn a CIDR prefix into a Subnet Mask
 */
function cidr2mask(cidr) {
    var bits = [];

    while (bits.length < cidr) { bits.push(1); }
    while (bits.length < 32) { bits.push(0); }

    var octets = [];

    octets.push(parseInt(bits.slice(0, 8).join(''), 2));
    octets.push(parseInt(bits.slice(8, 16).join(''), 2));
    octets.push(parseInt(bits.slice(16, 24).join(''), 2));
    octets.push(parseInt(bits.slice(24, 32).join(''), 2));

    return octets.join('.');
}

function IE_version() {
    // Set defaults
    var value = {
        is_IE: false,
        true_version: 0,
        acting_version: 0,
        compatibility_mode: false,
        compatible_string: false
    };

    // Try to find the Trident version number
    var trident = navigator.userAgent.match(/Trident\/(\d+)/);
    if (trident) {
        value.is_IE = true;
        // Convert from the Trident version number to the IE version number
        value.true_version = parseInt(trident[1], 10) + 4;
    }

    // Try to find the MSIE number
    var msie = navigator.userAgent.match(/MSIE (\d+)/);
    if (msie) {
        value.is_IE = true;
        // Find the IE version number from the user agent string
        value.acting_version = parseInt(msie[1]);
    } else {
        // Must be IE 11 in "edge" mode
        value.acting_version = value.true_version;
    }

    //console.dir( navigator.userAgent );
    // If we have both a Trident and MSIE version number, see if they're different
    if (value.is_IE && value.true_version > 0 && value.acting_version > 0) {
        // In compatibility mode if the trident number doesn't match
        // up with the MSIE number
        if (value.true_version !== value.acting_version) {
            value.compatibility_mode = true;
        }
        else {
            // Sometimes true_version and acting_version are equal
            // although compatibility mode is activated.
            // In those cases, sometimes the string "compatible;"
            // can be found in the user agent line.
            var compat_string = navigator.userAgent.match(/(compatible;)/);
            if (compat_string) {
                value.compatibility_mode = true;
            }
        }
    }

    return value;
}

function ie_compat_mode() {
    var ie_version = IE_version();
    return ie_version.compatibility_mode;
}