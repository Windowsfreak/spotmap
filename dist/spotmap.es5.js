'use strict';
/*! spotmap - v0.1.0 - 2017-03-25
* https://github.com/windowsfreak/spotmap
* Copyright (c) 2017 Björn Eberhardt; Licensed MIT */

// Source: src/scripts/base.js
// global
/* globals lang */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function ($) {
    $.ready = [];
    $.runLater = function () {
        return ($.ready = $.ready.map(function (item) {
            return typeof item === 'function' && item();
        }).filter(function (item) {
            return item;
        })).length && $.runLater();
    };
    $._ = function (s) {
        return s[0] === '#' ? document.getElementById(s.slice(1)) : document.querySelectorAll(s);
    };

    $.strip = function (html) {
        var tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.t = function (template, field) {
        if (!lang[template]) {
            console.log('MISSING: ' + template);
        }
        return lang[template] ? lang[template].replace('\\1', field) : 'MISSING: ' + template;
    };

    $.setLang = function (target) {
        localStorage.setItem('lang', target);
        location.reload();
    };

    $.t_html = function () {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = $._('*')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var item = _step.value;

                if (item.dataset.translate) {
                    item[['input', 'textarea'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.dataset.translate);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    };

    $.t_html();
})(window);
// Source: src/scripts/form.js
var Form = {};(function ($) {
    ready.push(function () {
        Nav.events.form_show = function () {
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            Maps.map.setCenter(Maps.marker.getPosition());
            google.maps.event.trigger(Maps.map, 'resize');
            google.maps.event.addListenerOnce(Maps.map, 'idle', function () {
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter(Maps.marker.getPosition());
            });
        };

        Nav.events.form_hide = function (isSame) {
            _('#map').className = '';
            if (localStorage.getItem('form_text') && !isSame) {
                Nav.success(t('draft_saved'));
            }
        };
    });

    $.add_here = function (type) {
        Maps.newMarker(Spot.spot, true);
        $.add(type);
    };

    $.add = function (type) {
        var formTypes = {
            spot: t('new_spot'),
            group: t('new_group'),
            event: t('new_event')
        };
        _('#form-type').innerText = formTypes[type];
        Spot.marker = { lat: Maps.marker.getPosition().lat(), lng: Maps.marker.getPosition().lng(), type: type };
        Nav.goTab('form');
    };

    $.backup = function () {
        localStorage.setItem('form_title', _('#form-title').value);
        localStorage.setItem('form_text', _('#form-text').value);
        localStorage.setItem('form_lat', Maps.marker.getPosition().lat());
        localStorage.setItem('form_lng', Maps.marker.getPosition().lng());
        if (Spot.marker) {
            localStorage.setItem('form_type', Spot.marker.type);
        }
    };

    $.restore = function () {
        if (localStorage.getItem('form_text')) {
            _('#form-title').value = localStorage.getItem('form_title');
            _('#form-text').value = localStorage.getItem('form_text');
            Spot.marker = {
                lat: parseFloat(localStorage.getItem('form_lat')),
                lng: parseFloat(localStorage.getItem('form_lng')),
                type: localStorage.getItem('form_type')
            };
            window.panToPosition = false;
            Maps.newMarker(Spot.marker, true);
            Maps.map.panTo(Spot.marker);
            $.add(Spot.marker.type);
            google.maps.event.addListenerOnce(Maps.map, 'idle', function () {
                Maps.map.panTo(Maps.marker.getPosition());
            });
            Nav.success(t('draft_restored'));
        }
    };

    $.remove = function (silent) {
        if (silent || confirm(t('draft_delete_confirm'))) {
            localStorage.removeItem('form_title');
            localStorage.removeItem('form_text');
            localStorage.removeItem('form_lat');
            localStorage.removeItem('form_lng');
            localStorage.removeItem('form_type');
            _('#form-title').value = '';
            _('#form-text').value = '';
            Nav.goTab('map', 0);
            if (!silent) {
                Nav.success(t('draft_deleted'));
            }
        }
    };

    $.save = function () {
        Http.get('//www.parkour.org/rest/session/token', undefined, { Authorization: false }).then(function (csrf) {
            Nav.success(t('in_progress'));
            Http.post('//www.parkour.org/entity/node?_format=hal_json', JSON.stringify({
                _links: { type: { href: 'https://www.parkour.org/rest/type/node/' + Spot.marker.type } },
                type: [{ target_id: Spot.marker.type }],
                title: [{ value: _('#form-title').value }],
                body: [{ value: _('#form-text').value }],
                field_location: [{
                    lat: Spot.marker.lat,
                    lon: Spot.marker.lng,
                    value: 'POINT (' + Spot.marker.lng + ' ' + Spot.marker.lat + ')'
                }]
            }), { 'Content-Type': 'application/hal+json', 'X-CSRF-Token': csrf.message }).then(function (data) {
                Nav.success(t('node_added'));
                location.href = '//www.parkour.org/de/node/' + Spot.find('nid|\\d+|value', data)[0] + '/edit';
                $.remove(true);
            }, function (data) {
                return Nav.error(t(data.status === 403 || data.status === 401 ? 'error_forbidden' : 'error_add_node'));
            });
        }, function () {
            return Nav.error(t('error_add_node'));
        });
    };
})(Form);
// Source: src/scripts/geohash.js
var Geohash = {};(function ($) {
    // Geohash library for Javascript
    // (c) 2008 David Troy
    // Distributed under the MIT License

    $.BITS = [16, 8, 4, 2, 1];

    $.BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    $.NEIGHBORS = {
        right: { even: "bc01fg45238967deuvhjyznpkmstqrwx" },
        left: { even: "238967debc01fg45kmstqrwxuvhjyznp" },
        top: { even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
        bottom: { even: "14365h7k9dcfesgujnmqp0r2twvyx8zb" }
    };
    $.BORDERS = {
        right: { even: "bcfguvyz" },
        left: { even: "0145hjnp" },
        top: { even: "prxz" },
        bottom: { even: "028b" }
    };

    $.NEIGHBORS.bottom.odd = $.NEIGHBORS.left.even;
    $.NEIGHBORS.top.odd = $.NEIGHBORS.right.even;
    $.NEIGHBORS.left.odd = $.NEIGHBORS.bottom.even;
    $.NEIGHBORS.right.odd = $.NEIGHBORS.top.even;

    $.BORDERS.bottom.odd = $.BORDERS.left.even;
    $.BORDERS.top.odd = $.BORDERS.right.even;
    $.BORDERS.left.odd = $.BORDERS.bottom.even;
    $.BORDERS.right.odd = $.BORDERS.top.even;

    $.refineInterval = function (interval, cd, mask) {
        return interval[cd & mask ? 0 : 1] = (interval[0] + interval[1]) / 2;
    };

    $.adjacent = function (srcHash, dir) {
        srcHash = srcHash.toLowerCase();
        var lastChr = srcHash.charAt(srcHash.length - 1);
        var type = srcHash.length % 2 ? 'odd' : 'even';
        var base = srcHash.substring(0, srcHash.length - 1);
        return ($.BORDERS[dir][type].indexOf(lastChr) !== -1 ? $.adjacent(base, dir) : base) + $.BASE32[$.NEIGHBORS[dir][type].indexOf(lastChr)];
    };

    $.decode = function (geohash) {
        var is_even = 1;
        var lat = [];
        var lon = [];
        lat[0] = -90.0;
        lat[1] = 90.0;
        lon[0] = -180.0;
        lon[1] = 180.0;
        var lat_err = 90.0;
        var lon_err = 180.0;

        for (var i = 0; i < geohash.length; i++) {
            var c = geohash[i];
            var cd = $.BASE32.indexOf(c);
            for (var j = 0; j < 5; j++) {
                var mask = $.BITS[j];
                if (is_even) {
                    lon_err /= 2;
                    $.refineInterval(lon, cd, mask);
                } else {
                    lat_err /= 2;
                    $.refineInterval(lat, cd, mask);
                }
                is_even = !is_even;
            }
        }
        lat[2] = (lat[0] + lat[1]) / 2;
        lon[2] = (lon[0] + lon[1]) / 2;

        return { lat: lat, lng: lon };
    };

    $.encode = function (latitude, longitude) {
        var is_even = 1;
        var lat = [];
        var lon = [];
        var bit = 0;
        var ch = 0;
        var precision = 12;
        var geohash = "";

        lat[0] = -90.0;
        lat[1] = 90.0;
        lon[0] = -180.0;
        lon[1] = 180.0;

        while (geohash.length < precision) {
            if (is_even) {
                var mid = (lon[0] + lon[1]) / 2;
                if (longitude > mid) {
                    ch |= $.BITS[bit];
                    lon[0] = mid;
                } else {
                    lon[1] = mid;
                }
            } else {
                var _mid = (lat[0] + lat[1]) / 2;
                if (latitude > _mid) {
                    ch |= $.BITS[bit];
                    lat[0] = _mid;
                } else {
                    lat[1] = _mid;
                }
            }

            is_even = !is_even;
            if (bit < 4) {
                bit++;
            } else {
                geohash += $.BASE32[ch];
                bit = 0;
                ch = 0;
            }
        }
        return geohash;
    };
})(Geohash);
// Source: src/scripts/geotile.js
var Geotile = {};(function ($) {
    var cache = {};
    var g_size = [[180, 360], [45, 45], [5.625, 11.25], [1.40625, 1.40625], [0.17578125, 0.3515625], [0.0439453125, 0.0439453125], [0.0054931640625, 0.010986328125], [0.001373291015625, 0.001373291015625], [0.000171661376953125, 0.00034332275390625], [0.00004291534423828125, 0.00004291534423828125], [0.000005364418029785156, 0.000010728836059570312], [0.000001341104507446289, 0.000001341104507446289], [1.6763806343078613e-7, 3.3527612686157227e-7]];

    $.onlyUnique = function (value, index, self) {
        return self.indexOf(value) === index;
    };

    $.extend = function (matrix, dir) {
        var matrix2 = matrix.slice(0);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = matrix2[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var value = _step2.value;

                matrix.push(Geohash.adjacent(value, dir));
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        return matrix.filter($.onlyUnique);
    };

    $.filter = function (obj, predicate) {
        var result = {};

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var tmp = predicate(key, obj[key]);
                if (tmp !== undefined) {
                    result[key] = tmp;
                }
            }
        }

        return result;
    };

    $.loadBounds = function (bounds, callback) {
        var b = void 0;
        if (bounds.lat) {
            b = bounds;
        } else {
            b = { sw: bounds.getSouthWest(), ne: bounds.getNorthEast() };
            b = { lat: [b.sw.lat(), b.ne.lat()], lng: [b.sw.lng(), b.ne.lng()] };
        }
        var c = { lat: b.lat.slice(0), lng: b.lng.slice(0) };
        if (c.lng[1] < c.lng[0]) {
            c.lng[1] += 360;
        }
        if (c.lng[0] + c.lng[1] > 360) {
            c.lng[1] -= 360;
            c.lng[0] -= 360;
        }
        var d = [c.lat[1] - c.lat[0], c.lng[1] - c.lng[0]];

        var zoom = void 0;
        var zx = Math.min(d[0], d[1]);
        if (zx > 23) {
            zoom = 0;
        } else if (zx > 2.8) {
            zoom = 1;
        } else if (zx > 0.7) {
            zoom = 2;
        } else if (zx > 0.087) {
            zoom = 3;
        } else if (zx > 0.022) {
            zoom = 4;
        } else if (zx > 0.0027) {
            zoom = 5;
        } else {
            zoom = 6;
        }
        if (zoom > 5 || zoom < 0) {
            zoom = -1;
        }

        var len = 12;

        while (len-- > 0) {
            if (g_size[len][0] > d[0] / 3 && g_size[len][1] > d[1] / 3) {
                break;
            }
        }

        len++;
        var matrix = void 0;

        while (len > 0) {
            len--;

            var size = g_size[len];

            var center = Geohash.encode((c.lat[0] + c.lat[1]) / 2, (c.lng[0] + c.lng[1]) / 2);
            var p = center.substring(0, len);

            matrix = [p];

            var q = Geohash.decode(p);
            if (q.lat[0] > b.lat[0]) {
                if (q.lat[0] - size[0] > b.lat[0]) {
                    continue;
                }
                matrix = $.extend(matrix, 'bottom');
            }
            if (q.lat[1] < b.lat[1]) {
                if (q.lat[1] + size[0] < b.lat[1]) {
                    continue;
                }
                matrix = $.extend(matrix, 'top');
            }
            if (q.lng[0] > b.lng[0]) {
                if (q.lng[0] - size[1] > b.lng[0]) {
                    continue;
                }
                matrix = $.extend(matrix, 'left');
            }
            if (q.lng[1] < b.lng[1]) {
                if (q.lng[1] + size[1] < b.lng[1]) {
                    continue;
                }
                matrix = $.extend(matrix, 'right');
            }
            break;
        }

        // success(JSON.stringify(matrix));

        if (!cache[zoom]) {
            cache[zoom] = {};
        }

        var result = {};
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = matrix[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var i = _step3.value;

                result[i] = cache[zoom][i];
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        var tmp = Object.keys($.filter(result, function (key, val) {
            return val === undefined ? key : undefined;
        })).map(function (key) {
            return key;
        });
        if (tmp.length) {
            Http.get('//www.parkour.org/map/query5j.php', { tiles: tmp.join(','), zoom: zoom }, { Authorization: false }).then(function (data) {
                Object.assign(cache[zoom], data);
                Object.assign(result, data);
                callback(result);
            }, function () {
                return Nav.error(t('error_load_spotmap'));
            });
        }
        callback(result);
        return result;
    };
})(Geotile);
// Source: src/scripts/help.js
var Help = {};(function ($) {
    ready.push(function () {
        return Nav.events.help_show = function (previous) {
            return $.previous = previous !== 'help' ? previous : $.previous;
        };
    });

    $.show = function (id) {
        Http.get('./static/' + id + '_' + l + '.json', undefined, { Authorization: false }).then(function (data) {
            _('#help-title').innerText = t('no_title');
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = Spot.find('title', data)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var s = _step4.value;

                    _('#help-title').innerText = s;
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            _('#help-body').innerText = t('no_body');
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = Spot.find('body', data)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _s = _step5.value;

                    _('#help-body').innerHTML = _s;
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            Nav.goTab('help');
        }, function (data) {
            return Nav.error(t('no_results_found'));
        });
    };
})(Help);
// Source: src/scripts/http.js
var Http = {};(function ($) {
    $.b64a = function (text) {
        return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    };

    $.getUser = function () {
        return localStorage.getItem('d8_user');
    };

    $.getCredentials = function () {
        return localStorage.getItem('d8_auth') || 'Basic Og==';
    };

    $.setCredentials = function (user, pass) {
        localStorage.setItem('d8_user', user);
        localStorage.setItem('d8_auth', 'Basic ' + $.b64a(user + ':' + pass));
    };

    $.deleteCredentials = function () {
        localStorage.removeItem('d8_user');
        localStorage.removeItem('d8_auth');
    };

    $.http = function (method, url, params) {
        var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        if (headers.Authorization === false) {
            delete headers.Authorization;
        } else if (headers.user) {
            headers.Authorization = 'Basic ' + $.b64a(headers.user + ':' + headers.pass);
            delete headers.user;
            delete headers.pass;
        } else if (url.match(/^(https?:)?\/\/(www\.)parkour\.org\/?/)) {
            headers.Authorization = $.getCredentials();
        }
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.response));
                    } catch (e) {
                        Nav.error(t('error_server_request'));
                        resolve({
                            method: method,
                            url: url,
                            params: params,
                            headers: headers,
                            status: this.status,
                            statusText: xhr.statusText,
                            message: xhr.response
                        });
                    }
                } else {
                    xhr.onerror();
                }
            };
            xhr.onerror = function () {
                Nav.error(t('error_server_request'));
                var data = {
                    method: method,
                    url: url,
                    params: params,
                    headers: headers,
                    status: this.status,
                    statusText: xhr.statusText,
                    message: xhr.response
                };
                reject(data);
            };
            if (headers) {
                Object.keys(headers).forEach(function (key) {
                    return xhr.setRequestHeader(key, headers[key]);
                });
            }
            // stringify params if object:
            if (params && (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
                xhr.send(Object.keys(params).map(function (key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&'));
            } else {
                xhr.send(params);
            }
        });
    };

    $.get = function (url, params, headers) {
        if (params && (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + Object.keys(params).map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&'), undefined, headers);
        } else if (params) {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + params, undefined, headers);
        } else {
            return $.http('GET', url, params, headers);
        }
    };
    $.post = function (url, params, headers) {
        return $.http('POST', url, params, headers);
    };
    $.patch = function (url, params, headers) {
        return $.http('PATCH', url, params, headers);
    };
    $.del = function (url, params, headers) {
        return $.http('REMOVE', url, params, headers);
    };
})(Http);
// Source: src/scripts/login.js
var Login = {};(function ($) {
    ready.push(function () {
        Nav.events.login_show = function () {
            if (Http.getUser() !== null) {
                Nav.goTab('logout-form');
                _('#username').innerText = Http.getUser();
            } else {
                Nav.goTab('login-form');
            }
        };
    });

    _('#login-submit').onclick = function () {
        var user = _('#login-username');
        var pass = _('#login-password');
        Http.setCredentials(user.value, pass.value);
        //get('//www.parkour.org/user/1',{_format: 'hal_json'}).then(function() {
        Nav.success(t('logged_in_as', user.value));
        user.value = '';
        pass.value = '';
        Nav.events.login_show();
        /*}, function() {
         error(t('error_login'));
         deleteCredentials();
         pass.value = '';
         pass.focus();
         });*/
    };

    _('#logout-submit').onclick = function () {
        Http.deleteCredentials();
        Nav.events.login_show();
    };
})(Login);
// Source: src/scripts/maps.js
var Maps = {};(function ($) {
    ready.push(function () {
        Nav.events.map_show = function () {
            if (window.google) {
                var pos = $.map.getCenter();
                google.maps.event.trigger($.map, 'resize');
                $.map.setCenter(pos);
            }
        };

        window.mapScripts = true;
        if (window.mapLoaded) {
            $.initMapInternal();
        }
    });

    var initial = Date.now;
    $.panToPosition = !location.hash.startsWith('#map/');
    $.filter = ['spot', 'event', 'group'];
    var gpsObj = void 0;
    $.icons = {};
    $.shapes = {};

    $.setGpsObj = function (position) {
        if (gpsObj) {
            gpsObj.setMap(null);
        }
        gpsObj = new google.maps.Circle({
            strokeColor: '#0000FF',
            strokeOpacity: 0.4,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.1,
            map: $.map,
            center: { lat: position.coords.latitude, lng: position.coords.longitude },
            radius: position.coords.accuracy,
            position: position
        });
    };

    $.updateGpsObj = function (position) {
        if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
            $.setGpsObj(position);
            return true;
        }
        return false;
    };

    $.pan = function (position) {
        var pan = function pan() {
            $.map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
            $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        };
        pan();
        google.maps.event.addListenerOnce($.map, 'idle', pan);
    };

    $.track = function (force) {
        if (force === 'yes') {
            window.panToPosition = true;
            Nav.goTab('map', 0);
        }
        var checkPan = function checkPan(position) {
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || !location.hash.startsWith('#map') && window.panToPosition) {
                    $.pan(position);
                }
            }
        };
        navigator.geolocation.getCurrentPosition(checkPan, function () {
            return false;
        }, { timeout: 250 });

        navigator.geolocation.getCurrentPosition(checkPan, function () {
            return false;
        }, { enableHighAccuracy: true });
    };

    $.markers = {};

    $.load = function (data, list) {
        var marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: '' + data.title,
            position: { lat: data.lat, lng: data.lng },
            data: data,
            icon: data.type.startsWith('multi') ? $.icons.zoom : data.type.includes('group') ? $.icons.group : data.type.includes('event') ? $.icons.event : $.icons.spot,
            shape: data.type.startsWith('multi') ? $.shapes.zoom : $.shapes.spot
        });
        list.push(marker);

        google.maps.event.addListener(marker, 'click', $.show);
    };

    $.show = function (marker) {
        if (!marker || marker.latLng || marker.pixel) {
            marker = this;
        }
        if (marker.data.category === 'add') {
            if (Nav.isLite) {
                return;
            }
            $.map.panTo(marker.getPosition());
            $.infoWindow.setContent('\n            <button type="button" onclick="Form.add(\'spot\')">&#x2795; ' + t('spot') + '</button>\n            <button type="button" onclick="Form.add(\'event\')">&#x2795; ' + t('event') + '</button>\n            <button type="button" onclick="Form.add(\'group\')">&#x2795; ' + t('group') + '</button>');
            $.infoWindow.open($.map, marker);
        } else if (marker.data.category.startsWith('multi')) {
            $.infoWindow.close();
            $.map.panTo(marker.getPosition());
            $.map.setZoom($.map.getZoom() + 2);
        } else {
            var icon = marker.data.type.startsWith('multi') ? $.icons.zoom : marker.data.type.includes('group') ? $.icons.group : marker.data.type.includes('event') ? $.icons.event : $.icons.spot;
            $.infoWindow.setContent('<a onclick="Nav.navigate(\'#spot/' + marker.data.id + '\');"><img class="type" src="' + icon.url + '">' + marker.data.title + '</a>');
            $.infoWindow.setPosition(marker.getPosition());
            $.infoWindow.open($.map);
            Proximity.getCloseNodes(marker.data.lat, marker.data.lng);
        }
    };

    $.loadAll = function (data) {
        for (var tile in data) {
            if (!$.markers[tile] || data[tile] && $.markers[tile].length !== data[tile].length) {
                var newTile = [];
                for (var entry in data[tile]) {
                    if ($.matchesFilter(data[tile][entry])) {
                        $.load(data[tile][entry], newTile);
                    }
                }
                if ($.markers[tile]) {
                    for (var marker in $.markers[tile]) {
                        $.markers[tile][marker].setMap(null);
                    }
                }
                $.markers[tile] = newTile;
            }
        }
        for (var _tile in $.markers) {
            if (!data[_tile]) {
                for (var _marker in $.markers[_tile]) {
                    $.markers[_tile][_marker].setMap(null);
                }
                delete $.markers[_tile];
            }
        }
    };

    $.handleBoundsChanged = function () {
        var bounds = $.map.getBounds();
        Geotile.loadBounds(bounds, $.loadAll);
        var center = $.map.getCenter();
        var coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
        if (location.hash !== coords && (location.hash.startsWith('#map/') || location.hash === '')) {
            history.replaceState({}, '', '#map/' + center.lat().toFixed(5) + '/' + center.lng().toFixed(5) + '/' + $.map.getZoom());
        }
    };

    $.initMapInternal = function () {
        var h = location.hash;
        var bounds = new google.maps.LatLngBounds({ lat: 49, lng: 6 }, { lat: 55, lng: 15 });
        var mapOptions = {
            center: { lat: 51.5167, lng: 9.9167 },
            zoom: 7
        };
        $.map = new google.maps.Map(_('#map'), mapOptions);

        $.geocoder = new google.maps.Geocoder();

        if (h.startsWith('#map/')) {
            // console.log(h);
            var coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            $.map.setCenter({ lat: parseFloat(coords[2]), lng: parseFloat(coords[3]) });
            if (coords[4]) {
                $.map.setZoom(parseInt(coords[4], 10));
            }
        } else if (!window.panToPosition) {
            $.map.setZoom(15);
            if (typeof Spot.spot.lat !== 'undefined') {
                $.map.setCenter(Spot.spot);
            }
        } else {
            $.map.fitBounds(bounds);
        }

        google.maps.event.addDomListener(window, 'resize', function () {
            var center = $.map.getCenter();
            google.maps.event.trigger($.map, 'resize');
            $.map.setCenter(center);
        });

        google.maps.event.addListener($.map, 'bounds_changed', $.handleBoundsChanged);

        google.maps.event.addListener($.map, 'click', $.newMarker);

        var filterDiv = document.createElement('div');
        $.createFilter(filterDiv);

        filterDiv.index = 1;
        $.map.controls[google.maps.ControlPosition.LEFT_TOP].push(filterDiv);

        $.icons.event = {
            url: 'images/green.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.icons.group = {
            url: 'images/purple.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.icons.spot = {
            url: 'images/logo32.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.shapes.spot = {
            coords: [15, 0, 31, 7, 15, 31, 0, 7, 15, 0],
            type: 'poly'
        };
        $.icons.zoom = {
            url: 'images/multi.png',
            size: new google.maps.Size(24, 24),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(8, 8)
        };
        $.shapes.zoom = {
            coords: [11, 0, 14, 1, 16, 3, 18, 5, 18, 13, 18, 15, 24, 20, 24, 23, 15, 19, 7, 18, 1, 15, 0, 7, 3, 2, 7, 0, 11, 0],
            type: 'poly'
        };
        $.icons.crosshair = {
            url: 'images/crosshair.png',
            size: new google.maps.Size(49, 49),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(24, 24)
        };

        $.infoWindow = new google.maps.InfoWindow({
            content: 'Some address here..',
            maxWidth: 500,
            pixelOffset: new google.maps.Size(0, -31)
        });

        $.track(true);
        //get('./query3j.php', {latl:48.188063481211415,lath:55.51619215717891,lngl:-0.54931640625,lngh:20.54443359375,zoom:2}).then(loadAll);
        Form.restore();
    };

    $.geocode = function (address) {
        $.geocoder.geocode({ 'address': address }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                $.newMarker({ latLng: results[0].geometry.location }, true);
                $.map.setCenter(results[0].geometry.location);
                $.map.setZoom(15);
            } else {
                Nav.error(t('error_geocode') + ' ' + status);
            }
        });
    };

    $.newMarker = function (event, force) {
        if (!event.latLng) {
            event.latLng = { lat: event.lat, lng: event.lng };
        }
        if (!force && Nav.isLite) {
            return;
        }
        if (!force && $.map.getZoom() < 14) {
            Nav.success(t('zoom'));
            return;
        }
        if ($.marker) {
            $.marker.setPosition(event.latLng);
        } else {
            $.marker = new google.maps.Marker({
                position: event.latLng,
                map: $.map,
                title: t('new_marker'),
                icon: $.icons.crosshair,
                draggable: !Nav.isLite,
                data: { category: 'add' }
            });
            $.marker.addListener('drag', $.dragMarker);
            $.marker.addListener('dragend', $.endMarker);
            $.marker.addListener('click', $.show);
            $.show($.marker);
        }
        $.dragMarker();
        Form.backup();
    };

    $.dragMarker = function (event) {
        return Nav.success(t('position') + ': ' + $.marker.getPosition().lat().toFixed(5) + ' ' + $.marker.getPosition().lng().toFixed(5));
    };

    $.endMarker = function (event) {
        $.map.panTo($.marker.getPosition());
        Form.backup();
    };

    $.clickMarker = function (event) {
        return $.show($.marker);
    };

    $.createFilter = function (filterDiv) {
        filterDiv.className = 'filterDiv';
        var controlUI = document.createElement('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        var filterBox = document.createElement('div');
        filterBox.className = 'filterBox vanish';
        filterDiv.appendChild(filterBox);
        filterBox.innerHTML = 'Zeige:<br />\n            <span class="yes" id="filter-spot" onclick="Maps.toggleFilter(\'spot\')">' + t('spot') + '</span><br />\n            <span class="yes" id="filter-event" onclick="Maps.toggleFilter(\'event\')">' + t('event') + '</span><br />\n            <span class="yes" id="filter-group" onclick="Maps.toggleFilter(\'group\')">' + t('group') + '</span>';
        controlUI.addEventListener('click', function () {
            var elem = _('.filterBox')[0];
            elem.className = elem.className === 'filterBox' ? 'filterBox vanish' : 'filterBox';
        });
    };

    $.toggleFilter = function (filterType) {
        var elem = _('#filter-' + filterType);
        elem.className = elem.className === 'yes' ? 'no' : 'yes';
        if (elem.className === 'yes') {
            if (!$.filter.includes(filterType)) {
                $.filter.push(filterType);
            }
        } else {
            var i = $.filter.indexOf(filterType);
            if (i !== -1) {
                $.filter.splice(i, 1);
            }
        }
        $.loadAll([]);
        $.handleBoundsChanged();
    };

    $.matchesFilter = function (entry) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = $.filter[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var f = _step6.value;

                if (entry.type.indexOf(f) !== -1) {
                    return true;
                }
            }
        } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                }
            } finally {
                if (_didIteratorError6) {
                    throw _iteratorError6;
                }
            }
        }

        return false;
    };
})(Maps);
// Source: src/scripts/nav.js
var Nav = {};(function ($) {
    $.events = {};
    $.isLite = false;

    $.openTab = function (id, evt) {
        var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _('#' + id).parentNode;

        var sections = _('section');
        var previous = void 0;
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].parentNode === parent) {
                if (sections[i].style.display === 'block') {
                    previous = sections[i].id;
                    console.log('Hiding  ' + sections[i].id);
                    if ($.events[sections[i].id + '_hide']) {
                        $.events[sections[i].id + '_hide'](id === sections[i].id);
                    }
                }
                sections[i].style.display = 'none';
            }
        }

        if (evt) {
            var buttons = _('button');
            for (var _i = 0; _i < buttons.length; _i++) {
                buttons[_i].className = buttons[_i].className.replace(' active', '');
            }
            evt.currentTarget.className += ' active';
        }

        _('#' + id).style.display = 'block';
        console.log('Showing ' + id);
        if ($.events[id + '_show']) {
            $.events[id + '_show'](previous);
        }
    };

    $.goTab = function (id, index) {
        return $.openTab(id, index !== undefined ? { currentTarget: _('button')[index] } : undefined);
    };
    $.resetTab = function () {
        return $.navigate('');
    };

    $.notice = function (text, type) {
        if (window.noticeHideTimeout) {
            $.noticeHide();
        }
        _('#notice').className = type + ' show';
        _('#notice-text').innerText = text;
        window.noticeHideTimeout = window.setTimeout($.noticeHide, 4000);
    };
    $.error = function (text) {
        return $.notice(text, 'error');
    };
    $.success = function (text) {
        return $.notice(text, 'success');
    };

    $.noticeHide = function (fast) {
        _('#notice').className += fast ? ' vanish' : ' hide';
        if (window.noticeHideTimeout) {
            window.clearTimeout(window.noticeHideTimeout);
            delete window.noticeHideTimeout;
        }
    };

    $.navigate = function (h) {
        if (typeof h === 'string') {
            location.hash = h;
            return;
        }
        h = location.hash;
        if (h.startsWith('#event/') || h.startsWith('#group/') || h.startsWith('#move/') || h.startsWith('#page/') || h.startsWith('#post/') || h.startsWith('#spot/')) {
            var match = /#(\w+)\/(\d+)(?:\/(.*))?/g.exec(h);
            if (match[3] === 'lite') {
                _('body')[0].className = 'lite';
                $.isLite = true;
            }
            Spot.loadSpot(match[2]);
        } else if (h.startsWith('#login')) {
            $.goTab('login', 2);
        } else if (h.startsWith('#search')) {
            $.goTab('search', 1);
            if (h.startsWith('#search/')) {
                _('#search-text').value = /#(\w+)\/(.*)/g.exec(h)[2];
                Search.loadSearch();
            }
        } else if (h === '' || h.startsWith('#map/')) {
            $.goTab('map', 0);
            if (h.startsWith('#map/')) {
                var coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
                // console.log([coords[2], coords[3], coords[4]]);
                if (Map.map) {
                    Map.map.panTo({ lat: parseFloat(coords[2]), lng: parseFloat(coords[3]) });
                    if (coords[4]) {
                        Map.map.setZoom(parseInt(coords[4], 10));
                    }
                }
            }
        }
    };

    $.goTab('map', 0);
    _('body')[0].onkeyup = function (e) {
        return e.which !== 27 || $.goTab('map', 0);
    };
    ready.push(function () {
        return function () {
            document.addEventListener('DOMContentLoaded', $.navigate, false);
            window.onhashchange = $.navigate;
        };
    });
})(Nav);
// Source: src/scripts/proximity.js
var Proximity = {};(function ($) {
    $.getCloseNodes = function (lat, lng) {
        var bounds = { lat: [lat - 0.0001, lat + 0.0001], lng: [lng - 0.0001, lng + 0.0001] };
        Geotile.loadBounds(bounds, function (data) {
            var entries = [];
            var order = { spot: 0, event: 1, group: 2 };
            for (var tile in data) {
                for (var item in data[tile]) {
                    var entry = data[tile][item];
                    if (entry.lat > bounds.lat[0] && entry.lat < bounds.lat[1] && entry.lng > bounds.lng[0] && entry.lng < bounds.lng[1]) {
                        entries.push(entry);
                    }
                }
            }
            var text = '';
            entries.sort(function (a, b) {
                return order[a.type] - order[b.type];
            });
            for (var _item in entries) {
                var _entry = entries[_item];
                text += '<a class="entry" onclick="Nav.navigate(\'#spot/' + _entry.id + '\');"><img class="type" src="' + Maps.icons[_entry.type].url + '">' + _entry.title + '</a>';
            }
            if (text !== '') {
                Maps.infoWindow.setContent(text);
            }
        });
    };
})(Proximity);
// Source: src/scripts/search.js
var Search = {};(function ($) {
    var search = {};
    _('#search-submit').onclick = function () {
        var text = _('#search-text').value;
        Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + text);
    };
    _('#search-geocode').onclick = function () {
        var text = _('#search-text').value;
        Maps.geocode(text);
        Nav.navigate('');
    };

    $.loadSearch = function () {
        var text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = { _format: 'hal_json', status: 'All', type: 'All', title: text, langcode: 'All', page: 0 };
            Http.get('//www.parkour.org/rest/content/node?status=All&type=All&title=&langcode=All&page=0', search.data, { Authorization: false }).then($.showPage);
        }
    };

    $.showPage = function (result) {
        var text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = result[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var spot = _step7.value;

                var nid = void 0;
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = Spot.find('nid|\\d+|value', spot)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var s = _step8.value;

                        nid = s;
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }

                text += '<article onclick="Nav.navigate(\'#spot/' + nid + '\');">';

                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = Spot.find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var _s2 = _step9.value;

                        text += '<div class="in-place cover" style="background-image: url(' + Spot.getUrl(_s2) + ');"></div>';
                        if (_s2) {
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError9 = true;
                    _iteratorError9 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion9 && _iterator9.return) {
                            _iterator9.return();
                        }
                    } finally {
                        if (_didIteratorError9) {
                            throw _iteratorError9;
                        }
                    }
                }

                text += '<div class="in-place title">';
                _('#spot-title').innerText = t('no_title');
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = Spot.find('title|\\d+|value', spot)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var _s3 = _step10.value;

                        text += '<h1><span>' + strip(_s3) + '</span></h1>';
                    }
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10.return) {
                            _iterator10.return();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }

                var _iteratorNormalCompletion11 = true;
                var _didIteratorError11 = false;
                var _iteratorError11 = undefined;

                try {
                    for (var _iterator11 = Spot.find('body|\\d+|value', spot)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                        var _s4 = _step11.value;

                        text += '<p><span>' + strip(_s4).substring(0, 100) + '</span></p>';
                    }
                } catch (err) {
                    _didIteratorError11 = true;
                    _iteratorError11 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion11 && _iterator11.return) {
                            _iterator11.return();
                        }
                    } finally {
                        if (_didIteratorError11) {
                            throw _iteratorError11;
                        }
                    }
                }

                text += '</div>';
                text += '</article>';
            }
        } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                }
            } finally {
                if (_didIteratorError7) {
                    throw _iteratorError7;
                }
            }
        }

        text += '</div>';
        _('#search-page').innerHTML = text;
    };
})(Search);
// Source: src/scripts/spot.js
var Spot = {};(function ($) {
    $.spot = {};

    ready.push(function () {
        return Nav.events.spot_hide = function () {
            return _('#map').className = '';
        };
    });

    $.loadSpot = function (id) {
        Http.get('//www.parkour.org/' + l + '/rest/node/' + id, { _format: 'hal_json' }, { Authorization: false }).then(function (data) {
            $.spot = { id: id };

            _('#spot-type').innerText = '';
            var _iteratorNormalCompletion12 = true;
            var _didIteratorError12 = false;
            var _iteratorError12 = undefined;

            try {
                for (var _iterator12 = $.find('\\d+|type|\\d+|target_id', data)[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                    var s = _step12.value;

                    _('#spot').className = 'spot-type-' + s;
                    _('#spot-type').innerText = t('type_' + s);
                }
                /* spot */
            } catch (err) {
                _didIteratorError12 = true;
                _iteratorError12 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion12 && _iterator12.return) {
                        _iterator12.return();
                    }
                } finally {
                    if (_didIteratorError12) {
                        throw _iteratorError12;
                    }
                }
            }

            var _iteratorNormalCompletion13 = true;
            var _didIteratorError13 = false;
            var _iteratorError13 = undefined;

            try {
                for (var _iterator13 = $.find('\\d+|field_spot_type|\\d+|value', data)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                    var _s5 = _step13.value;

                    _('#spot-type').innerText = t('spot_type_' + _s5);
                }
                /* move */
            } catch (err) {
                _didIteratorError13 = true;
                _iteratorError13 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion13 && _iterator13.return) {
                        _iterator13.return();
                    }
                } finally {
                    if (_didIteratorError13) {
                        throw _iteratorError13;
                    }
                }
            }

            var _iteratorNormalCompletion14 = true;
            var _didIteratorError14 = false;
            var _iteratorError14 = undefined;

            try {
                for (var _iterator14 = $.find('\\d+|field_category|\\d+|value', data)[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                    var _s6 = _step14.value;

                    _('#spot-type').innerText = t('move_type_' + _s6);
                }
                /* move */
            } catch (err) {
                _didIteratorError14 = true;
                _iteratorError14 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion14 && _iterator14.return) {
                        _iterator14.return();
                    }
                } finally {
                    if (_didIteratorError14) {
                        throw _iteratorError14;
                    }
                }
            }

            var _iteratorNormalCompletion15 = true;
            var _didIteratorError15 = false;
            var _iteratorError15 = undefined;

            try {
                for (var _iterator15 = $.find('\\d+|field_move_category|\\d+|value', data)[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                    var _s7 = _step15.value;

                    _('#spot-type').innerText = t('move_type_' + _s7);
                }
                /* move */
            } catch (err) {
                _didIteratorError15 = true;
                _iteratorError15 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion15 && _iterator15.return) {
                        _iterator15.return();
                    }
                } finally {
                    if (_didIteratorError15) {
                        throw _iteratorError15;
                    }
                }
            }

            var _iteratorNormalCompletion16 = true;
            var _didIteratorError16 = false;
            var _iteratorError16 = undefined;

            try {
                for (var _iterator16 = $.find('\\d+|field_level|\\d+|value', data)[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                    var _s8 = _step16.value;

                    _('#spot-type').innerText += ' (' + t('move_type_' + _s8) + ')';
                }
                /* group */
            } catch (err) {
                _didIteratorError16 = true;
                _iteratorError16 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion16 && _iterator16.return) {
                        _iterator16.return();
                    }
                } finally {
                    if (_didIteratorError16) {
                        throw _iteratorError16;
                    }
                }
            }

            var _iteratorNormalCompletion17 = true;
            var _didIteratorError17 = false;
            var _iteratorError17 = undefined;

            try {
                for (var _iterator17 = $.find('\\d+|field_group_type|\\d+|value', data)[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                    var _s9 = _step17.value;

                    _('#spot-type').innerText = t('group_type_' + _s9);
                }
                /* event */
            } catch (err) {
                _didIteratorError17 = true;
                _iteratorError17 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion17 && _iterator17.return) {
                        _iterator17.return();
                    }
                } finally {
                    if (_didIteratorError17) {
                        throw _iteratorError17;
                    }
                }
            }

            var _iteratorNormalCompletion18 = true;
            var _didIteratorError18 = false;
            var _iteratorError18 = undefined;

            try {
                for (var _iterator18 = $.find('\\d+|field_event_type|\\d+|value', data)[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                    var _s10 = _step18.value;

                    _('#spot-type').innerText = t('event_type_' + _s10);
                }
            } catch (err) {
                _didIteratorError18 = true;
                _iteratorError18 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                        _iterator18.return();
                    }
                } finally {
                    if (_didIteratorError18) {
                        throw _iteratorError18;
                    }
                }
            }

            _('#spot-title').innerText = t('no_title');
            var _iteratorNormalCompletion19 = true;
            var _didIteratorError19 = false;
            var _iteratorError19 = undefined;

            try {
                for (var _iterator19 = $.find('\\d+|title|\\d+|value', data)[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
                    var _s11 = _step19.value;

                    _('#spot-title').innerText = _s11;
                }
            } catch (err) {
                _didIteratorError19 = true;
                _iteratorError19 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion19 && _iterator19.return) {
                        _iterator19.return();
                    }
                } finally {
                    if (_didIteratorError19) {
                        throw _iteratorError19;
                    }
                }
            }

            _('#spot-body').innerText = t('no_body');
            var _iteratorNormalCompletion20 = true;
            var _didIteratorError20 = false;
            var _iteratorError20 = undefined;

            try {
                for (var _iterator20 = $.find('\\d+|body|\\d+|value', data)[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
                    var _s12 = _step20.value;

                    _('#spot-body').innerHTML = _s12;
                }
            } catch (err) {
                _didIteratorError20 = true;
                _iteratorError20 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion20 && _iterator20.return) {
                        _iterator20.return();
                    }
                } finally {
                    if (_didIteratorError20) {
                        throw _iteratorError20;
                    }
                }
            }

            var text = '';
            var _iteratorNormalCompletion21 = true;
            var _didIteratorError21 = false;
            var _iteratorError21 = undefined;

            try {
                for (var _iterator21 = $.find('\\d+|_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', data)[Symbol.iterator](), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
                    var _s13 = _step21.value;

                    text += '<img src="' + $.getUrl(_s13) + '" />';
                }
            } catch (err) {
                _didIteratorError21 = true;
                _iteratorError21 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion21 && _iterator21.return) {
                        _iterator21.return();
                    }
                } finally {
                    if (_didIteratorError21) {
                        throw _iteratorError21;
                    }
                }
            }

            _('#spot-images').innerHTML = text || t('no_images');

            //_('#spot-lat').innerText = 'Keine Standortangabe vorhanden.';
            var _iteratorNormalCompletion22 = true;
            var _didIteratorError22 = false;
            var _iteratorError22 = undefined;

            try {
                for (var _iterator22 = $.find('\\d+|field_location|\\d+|lat', data)[Symbol.iterator](), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
                    var _s14 = _step22.value;

                    $.spot.lat = _s14;
                    _('#spot-lat').innerHTML = _s14;
                }

                //_('#spot-lng').innerText = 'Keine Standortangabe vorhanden.';
            } catch (err) {
                _didIteratorError22 = true;
                _iteratorError22 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion22 && _iterator22.return) {
                        _iterator22.return();
                    }
                } finally {
                    if (_didIteratorError22) {
                        throw _iteratorError22;
                    }
                }
            }

            var _iteratorNormalCompletion23 = true;
            var _didIteratorError23 = false;
            var _iteratorError23 = undefined;

            try {
                for (var _iterator23 = $.find('\\d+|field_location|\\d+|lon', data)[Symbol.iterator](), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
                    var _s15 = _step23.value;

                    $.spot.lng = _s15;
                    _('#spot-lng').innerHTML = _s15;
                }
            } catch (err) {
                _didIteratorError23 = true;
                _iteratorError23 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion23 && _iterator23.return) {
                        _iterator23.return();
                    }
                } finally {
                    if (_didIteratorError23) {
                        throw _iteratorError23;
                    }
                }
            }

            Nav.goTab('spot');

            if ($.spot.lat && $.spot.lng) {
                _('#spot-geo').style.display = 'block';
                _('#spot-map').style.display = 'inline';
                _('#spot-maps-form').style.display = 'inline';
                _('.add-here').forEach(function (item) {
                    return item.style.display = 'inline-block';
                });
                _('#spot-maps-formdata').value = $.spot.lat + ',' + $.spot.lng;
                //_('#spot-maps-form').action = `//maps.google.de/maps?q=${$.spot.lat},${$.spot.lng}`;
                _('#map').style.display = 'block';
                _('#map').className = 'half';
                Maps.panToPosition = false;
                google.maps.event.addListenerOnce(Maps.map, 'idle', function () {
                    google.maps.event.trigger(Maps.map, 'resize');
                    Maps.map.setCenter($.spot);
                    Maps.map.setZoom(15);
                });
                console.log($.spot);
                if (Nav.isLite) {
                    Maps.newMarker($.spot, true);
                }
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter($.spot);
                Maps.map.setZoom(15);
            } else {
                _('#spot-geo').style.display = 'none';
                _('#spot-map').style.display = 'none';
                _('#spot-maps-form').style.display = 'none';
                _('.add-here').forEach(function (item) {
                    return item.style.display = 'none';
                });
            }
        }, function (data) {
            return Nav.error(t('error_load_spot'));
        });
    };

    $.getUrl = function (imageUrl) {
        return imageUrl.replace('/sites/default/files/20', '/sites/default/files/styles/grid/public/20');
    };

    $.find = function (path, json) {
        var jsons = [json];
        path = path.split('|');
        var _iteratorNormalCompletion24 = true;
        var _didIteratorError24 = false;
        var _iteratorError24 = undefined;

        try {
            for (var _iterator24 = path[Symbol.iterator](), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
                var p = _step24.value;

                var pr = new RegExp('^' + p + '$'),
                    list = [];
                var _iteratorNormalCompletion25 = true;
                var _didIteratorError25 = false;
                var _iteratorError25 = undefined;

                try {
                    for (var _iterator25 = jsons[Symbol.iterator](), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
                        var j = _step25.value;

                        for (var n in j) {
                            if (j.hasOwnProperty(n)) {
                                if (pr.test(n)) {
                                    list.push(j[n]);
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError25 = true;
                    _iteratorError25 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion25 && _iterator25.return) {
                            _iterator25.return();
                        }
                    } finally {
                        if (_didIteratorError25) {
                            throw _iteratorError25;
                        }
                    }
                }

                jsons = list;
            }
        } catch (err) {
            _didIteratorError24 = true;
            _iteratorError24 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion24 && _iterator24.return) {
                    _iterator24.return();
                }
            } finally {
                if (_didIteratorError24) {
                    throw _iteratorError24;
                }
            }
        }

        return jsons;
    };

    _('#spot-map').onclick = function () {
        Nav.navigate('');
        Maps.map.setCenter($.spot);
        Maps.map.setZoom(15);
    };

    _('#spot-web').onclick = function () {
        location.href = '//www.parkour.org/' + l + '/node/' + $.spot.id;
    };
})(Spot);
// Source: src/scripts/z.js
(function () {
    window.runLater();
    window.addEventListener("load", function () {
        return setTimeout(function () {
            return window.scrollTo(0, 1);
        }, 0);
    });
})();
