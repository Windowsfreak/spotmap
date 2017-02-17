'use strict';
/*! spotmap - v0.1.0 - 2017-02-17
* https://github.com/windowsfreak/spotmap
* Copyright (c) 2017 Björn Eberhardt; Licensed MIT */

// Source: src/scripts/base.js

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _(s) {
    if (s[0] == '#') return document.getElementById(s.slice(1));else return document.querySelectorAll(s);
}

function strip(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function t(template) {
    if (!lang[template]) console.log('MISSING: ' + template);
    return lang[template] ? lang[template].replace('\\1', arguments[1]) : 'MISSING: ' + template;
}

function setLang(target) {
    localStorage.setItem('lang', target);
    location.reload();
}

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = _('*')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var item = _step.value;

        if (item.dataset.translate) {
            if (['input', 'textarea'].indexOf(item.tagName.toLowerCase()) >= 0) {
                item.placeholder = t(item.dataset.translate);
            } else {
                item.innerHTML = t(item.dataset.translate);
            }
        }
    }
    // Source: src/scripts/boot.js
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

document.addEventListener('DOMContentLoaded', navigate, false);
// Source: src/scripts/form.js
window.nav = window.nav === undefined ? {} : window.nav;

if (!window.spots) window.spots = { spot: {}, marker: {} };

nav.form_show = function () {
    _('#map').style.display = 'block';
    _('#map').className = 'half';
    map.setCenter(marker.getPosition());
    google.maps.event.trigger(map, 'resize');
    google.maps.event.addListenerOnce(map, 'idle', function () {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(marker.getPosition());
    });
};

nav.form_hide = function (isSame) {
    _('#map').className = '';
    if (localStorage.getItem('form_text') && !isSame) {
        success(t('draft_saved'));
    }
};

function add_here(type) {
    newMarker({ latLng: { lat: spots.spot.lat, lng: spots.spot.lng } }, true);
    add(type);
}

function add(type) {
    var formTypes = {
        spot: t('new_spot'),
        group: t('new_group'),
        event: t('new_event')
    };
    _('#form-type').innerText = formTypes[type];
    spots.marker = { lat: marker.getPosition().lat(), lng: marker.getPosition().lng(), type: type };
    goTab('form');
}

function backup() {
    localStorage.setItem('form_title', _('#form-title').value);
    localStorage.setItem('form_text', _('#form-text').value);
    localStorage.setItem('form_lat', marker.getPosition().lat());
    localStorage.setItem('form_lng', marker.getPosition().lng());
    if (spots.marker) {
        localStorage.setItem('form_type', spots.marker.type);
    }
}

function restore() {
    if (localStorage.getItem('form_text')) {
        _('#form-title').value = localStorage.getItem('form_title');
        _('#form-text').value = localStorage.getItem('form_text');
        spots.marker = {
            lat: parseFloat(localStorage.getItem('form_lat')),
            lng: parseFloat(localStorage.getItem('form_lng')),
            type: localStorage.getItem('form_type')
        };
        window.panToPosition = false;
        newMarker({ latLng: { lat: spots.marker.lat, lng: spots.marker.lng } }, true);
        map.panTo({ lat: spots.marker.lat, lng: spots.marker.lng });
        add(spots.marker.type);
        google.maps.event.addListenerOnce(map, 'idle', function () {
            map.panTo(marker.getPosition());
        });
        success(t('draft_restored'));
    }
}

function remove(silent) {
    if (!silent && !confirm(t('draft_delete_confirm'))) return;
    localStorage.removeItem('form_title');
    localStorage.removeItem('form_text');
    localStorage.removeItem('form_lat');
    localStorage.removeItem('form_lng');
    localStorage.removeItem('form_type');
    _('#form-title').value = '';
    _('#form-text').value = '';
    goTab('map', 0);
    if (!silent) success(t('draft_deleted'));
}

function save() {
    get('//www.parkour.org/rest/session/token', undefined, { Authorization: false }).then(function (csrf) {
        success(t('in_progress'));
        post('//www.parkour.org/entity/node?_format=hal_json', JSON.stringify({
            _links: { type: { href: 'http://www.parkour.org/rest/type/node/' + spots.marker.type } },
            type: [{ target_id: spots.marker.type }],
            title: [{ value: _('#form-title').value }],
            body: [{ value: _('#form-text').value }],
            field_location: [{ lat: spots.marker.lat, lon: spots.marker.lng, value: 'POINT (' + spots.marker.lng + ' ' + spots.marker.lat + ')' }]
        }), { 'Content-Type': 'application/hal+json', 'X-CSRF-Token': csrf.message }).then(function (data) {
            success(t('node_added'));
            location.href = '//www.parkour.org/de/node/' + find('nid|\\d+|value', data)[0] + '/edit';
            remove(true);
        }, function (data) {
            if (data.status == 403 || data.status == 401) {
                error(t('error_forbidden'));
            } else {
                error(t('error_add_node'));
            }
            console.log(data);
        });
    }, function () {
        error(t('error_add_node'));
    });
}
// Source: src/scripts/geohash.js
// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// Distributed under the MIT License

var BITS = [16, 8, 4, 2, 1];

var BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
var NEIGHBORS = { right: { even: "bc01fg45238967deuvhjyznpkmstqrwx" },
    left: { even: "238967debc01fg45kmstqrwxuvhjyznp" },
    top: { even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
    bottom: { even: "14365h7k9dcfesgujnmqp0r2twvyx8zb" } };
var BORDERS = { right: { even: "bcfguvyz" },
    left: { even: "0145hjnp" },
    top: { even: "prxz" },
    bottom: { even: "028b" } };

NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
NEIGHBORS.top.odd = NEIGHBORS.right.even;
NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
NEIGHBORS.right.odd = NEIGHBORS.top.even;

BORDERS.bottom.odd = BORDERS.left.even;
BORDERS.top.odd = BORDERS.right.even;
BORDERS.left.odd = BORDERS.bottom.even;
BORDERS.right.odd = BORDERS.top.even;

function refine_interval(interval, cd, mask) {
    if (cd & mask) interval[0] = (interval[0] + interval[1]) / 2;else interval[1] = (interval[0] + interval[1]) / 2;
}

function calculateAdjacent(srcHash, dir) {
    srcHash = srcHash.toLowerCase();
    var lastChr = srcHash.charAt(srcHash.length - 1);
    var type = srcHash.length % 2 ? 'odd' : 'even';
    var base = srcHash.substring(0, srcHash.length - 1);
    if (BORDERS[dir][type].indexOf(lastChr) != -1) base = calculateAdjacent(base, dir);
    return base + BASE32[NEIGHBORS[dir][type].indexOf(lastChr)];
}

function decodeGeoHash(geohash) {
    var is_even = 1;
    var lat = [];var lon = [];
    lat[0] = -90.0;lat[1] = 90.0;
    lon[0] = -180.0;lon[1] = 180.0;
    var lat_err = 90.0;var lon_err = 180.0;

    for (var i = 0; i < geohash.length; i++) {
        var c = geohash[i];
        var cd = BASE32.indexOf(c);
        for (var j = 0; j < 5; j++) {
            var mask = BITS[j];
            if (is_even) {
                lon_err /= 2;
                refine_interval(lon, cd, mask);
            } else {
                lat_err /= 2;
                refine_interval(lat, cd, mask);
            }
            is_even = !is_even;
        }
    }
    lat[2] = (lat[0] + lat[1]) / 2;
    lon[2] = (lon[0] + lon[1]) / 2;

    return { lat: lat, lng: lon };
}

function encodeGeoHash(latitude, longitude) {
    var is_even = 1;
    var i = 0;
    var lat = [];var lon = [];
    var bit = 0;
    var ch = 0;
    var precision = 12;
    var geohash = "";

    lat[0] = -90.0;lat[1] = 90.0;
    lon[0] = -180.0;lon[1] = 180.0;

    while (geohash.length < precision) {
        if (is_even) {
            var mid = (lon[0] + lon[1]) / 2;
            if (longitude > mid) {
                ch |= BITS[bit];
                lon[0] = mid;
            } else lon[1] = mid;
        } else {
            var _mid = (lat[0] + lat[1]) / 2;
            if (latitude > _mid) {
                ch |= BITS[bit];
                lat[0] = _mid;
            } else lat[1] = _mid;
        }

        is_even = !is_even;
        if (bit < 4) bit++;else {
            geohash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    return geohash;
}
// Source: src/scripts/geotile.js
var geotiles = {};
var g_size = [[180, 360], [45, 45], [5.625, 11.25], [1.40625, 1.40625], [0.17578125, 0.3515625], [0.0439453125, 0.0439453125], [0.0054931640625, 0.010986328125], [0.001373291015625, 0.001373291015625], [0.000171661376953125, 0.00034332275390625], [0.00004291534423828125, 0.00004291534423828125], [0.000005364418029785156, 0.000010728836059570312], [0.000001341104507446289, 0.000001341104507446289], [1.6763806343078613e-7, 3.3527612686157227e-7]];

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function extend(matrix, dir) {
    var matrix2 = matrix.slice(0);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = matrix2[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var value = _step2.value;

            matrix.push(calculateAdjacent(value, dir));
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

    return matrix.filter(onlyUnique);
}

function filter(obj, predicate) {
    var result = {};

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var tmp = predicate(key, obj[key]);
            if (tmp !== undefined) result[key] = tmp;
        }
    }

    return result;
}

function loadBounds(bounds, callback) {
    var b = void 0;
    if (bounds.lat) {
        b = bounds;
    } else {
        b = { sw: bounds.getSouthWest(), ne: bounds.getNorthEast() };
        b = { lat: [b.sw.lat(), b.ne.lat()], lng: [b.sw.lng(), b.ne.lng()] };
    }
    var c = { lat: b.lat.slice(0), lng: b.lng.slice(0) };
    if (c.lng[1] < c.lng[0]) c.lng[1] += 360;
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
    if (zoom > 5 || zoom < 0) zoom = -1;

    var len = 12;

    while (len-- > 0) {
        if (g_size[len][0] > d[0] / 3 && g_size[len][1] > d[1] / 3) break;
    }

    len++;
    var matrix = void 0;

    while (true) {
        len--;

        var size = g_size[len];

        var center = encodeGeoHash((c.lat[0] + c.lat[1]) / 2, (c.lng[0] + c.lng[1]) / 2);
        var p = center.substring(0, len);

        matrix = [p];

        var q = decodeGeoHash(p);
        if (q.lat[0] > b.lat[0]) {
            if (q.lat[0] - size[0] > b.lat[0]) continue;
            matrix = extend(matrix, 'bottom');
        }
        if (q.lat[1] < b.lat[1]) {
            if (q.lat[1] + size[0] < b.lat[1]) continue;
            matrix = extend(matrix, 'top');
        }
        if (q.lng[0] > b.lng[0]) {
            if (q.lng[0] - size[1] > b.lng[0]) continue;
            matrix = extend(matrix, 'left');
        }
        if (q.lng[1] < b.lng[1]) {
            if (q.lng[1] + size[1] < b.lng[1]) continue;
            matrix = extend(matrix, 'right');
        }
        break;
    }

    // success(JSON.stringify(matrix));

    if (!geotiles[zoom]) geotiles[zoom] = {};

    var result = {};
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = matrix[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var i = _step3.value;

            result[i] = geotiles[zoom][i];
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

    var tmp = Object.keys(filter(result, function (key, val) {
        return val === undefined ? key : undefined;
    })).map(function (key) {
        return key;
    });
    if (tmp.length) {
        get('//www.parkour.org/map/query5j.php', { tiles: tmp.join(','), zoom: zoom }).then(function (data) {
            Object.assign(geotiles[zoom], data);
            Object.assign(result, data);
            callback(result);
        }, function () {
            error(t('error_load_spotmap'));
        });
    }
    callback(result);
    return result;
}
// Source: src/scripts/http.js
function b64a(text) {
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}
function getUser() {
    return localStorage.getItem('d8_user');
}
function getCredentials() {
    return localStorage.getItem('d8_auth') || 'Basic Og==';
}
function setCredentials(user, pass) {
    localStorage.setItem('d8_user', user);
    localStorage.setItem('d8_auth', 'Basic ' + b64a(user + ':' + pass));
}
function deleteCredentials() {
    localStorage.removeItem('d8_user');
    localStorage.removeItem('d8_auth');
}
function http(method, url, params) {
    var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    if (headers.Authorization === false) {
        delete headers.Authorization;
    } else if (headers.user) {
        headers.Authorization = 'Basic ' + b64a(headers.user + ':' + headers.pass);
        delete headers.user;
        delete headers.pass;
    } else if (url.match(/^(https?:)?\/\/(www\.)parkour\.org\/?/)) {
        headers.Authorization = getCredentials();
    }
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    error(t('error_server_request'));
                    resolve({ method: method, url: url, params: params, headers: headers, status: this.status, statusText: xhr.statusText, message: xhr.response });
                }
            } else {
                xhr.onerror();
            }
        };
        xhr.onerror = function () {
            error(t('error_server_request'));
            var data = { method: method, url: url, params: params, headers: headers, status: this.status, statusText: xhr.statusText, message: xhr.response };
            reject(data);
        };
        if (headers) {
            Object.keys(headers).forEach(function (key) {
                xhr.setRequestHeader(key, headers[key]);
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
}
function get(url, params, headers) {
    if (params && (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object') {
        return http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + Object.keys(params).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&'), undefined, headers);
    } else if (params) {
        return http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + params, undefined, headers);
    } else {
        return http('GET', url, params, headers);
    }
}
function post(url, params, headers) {
    return http('POST', url, params, headers);
}
function patch(url, params, headers) {
    return http('PATCH', url, params, headers);
}
function del(url, params, headers) {
    return http('REMOVE', url, params, headers);
}
// Source: src/scripts/login.js
window.nav = window.nav === undefined ? {} : window.nav;

nav.login_show = function () {
    if (getUser() !== null) {
        goTab('logout-form');
        _('#username').innerText = getUser();
    } else {
        goTab('login-form');
    }
};

_('#login-submit').onclick = function () {
    var user = _('#login-username');
    var pass = _('#login-password');
    setCredentials(user.value, pass.value);
    //get('//www.parkour.org/user/1',{_format: 'hal_json'}).then(function() {
    success(t('logged_in_as', user.value));
    user.value = '';
    pass.value = '';
    nav.login_show();
    /*}, function() {
        error(t('error_login'));
        deleteCredentials();
        pass.value = '';
        pass.focus();
    });*/
};

_('#logout-submit').onclick = function () {
    deleteCredentials();
    nav.login_show();
};
// Source: src/scripts/map.js
window.nav = window.nav === undefined ? {} : window.nav;

if (!window.spots) window.spots = { spot: {}, marker: {} };

nav.map_show = function () {
    if (window.google) {
        var pos = map.getCenter();
        google.maps.event.trigger(map, 'resize');
        map.setCenter(pos);
    }
};

var map = void 0,
    marker = void 0,
    infoWindow = void 0;
var initial = Date.now;
window.panToPosition = window.panToPosition === undefined ? !location.hash.startsWith('#map/') : window.panToPosition;
var gpsObj = void 0;
var icons = {};
var shapes = {};

function setGpsObj(position) {
    if (gpsObj) {
        gpsObj.setMap(null);
    }
    gpsObj = new google.maps.Circle({
        strokeColor: '#0000FF',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.1,
        map: map,
        center: { lat: position.coords.latitude, lng: position.coords.longitude },
        radius: position.coords.accuracy,
        position: position
    });
}
function updateGpsObj(position) {
    if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
        setGpsObj(position);
        return true;
    }
    return false;
}
function pan(position) {
    map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
    map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
    google.maps.event.addListenerOnce(map, 'idle', function () {
        map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
    });
}
function afterTrack() {
    //_('button')[3].blur();
    //goTab('map', 0);
}
function track(force) {
    if (force === 'yes') {
        window.panToPosition = true;
        goTab('map', 0);
    }
    navigator.geolocation.getCurrentPosition(function (position) {
        //marker.setPosition({lat: position.coords.latitude, lng: position.coords.longitude});
        if (updateGpsObj(position) && (force || Date.now < initial + 10000)) {
            if (force === 'yes' || !location.hash.startsWith('#map') && window.panToPosition) {
                pan(position);
            }
        }
    }, function () {
        // console.log('error1', arguments);
    }, { timeout: 250 });

    navigator.geolocation.getCurrentPosition(function (position) {
        if (updateGpsObj(position) && (force || Date.now < initial + 10000)) {
            if (force === 'yes' || !location.hash.startsWith('#map') && window.panToPosition) {
                pan(position);
            }
        }
        afterTrack();
    }, function () {
        // console.log('error2', arguments);
        afterTrack();
    }, { enableHighAccuracy: true });
}

var markers = [];

function load(data) {
    var marker = new google.maps.Marker({
        id: data.id,
        map: map,
        title: '' + data.title,
        position: { lat: data.lat, lng: data.lng },
        data: data,
        icon: data.type.startsWith('multi') ? icons.zoom : data.type.includes('group') ? icons.group : data.type.includes('event') ? icons.event : icons.spot,
        shape: data.type.startsWith('multi') ? shapes.zoom : shapes.spot
    });
    markers.push(marker);

    google.maps.event.addListener(marker, 'click', show);
}

function show(marker) {
    if (!marker || marker.latLng || marker.pixel) {
        marker = this;
    }
    if (marker.data.category === 'add') {
        if (isLite) return;
        map.panTo(marker.getPosition());
        infoWindow.setContent('\n            <button type="button" onclick="add(\'spot\')">&#x2795; ' + t('spot') + '</button>\n            <button type="button" onclick="add(\'event\')">&#x2795; ' + t('event') + '</button>\n            <button type="button" onclick="add(\'group\')">&#x2795; ' + t('group') + '</button>');
        infoWindow.open(map, marker);
    } else if (marker.data.category.startsWith('multi')) {
        infoWindow.close();
        map.panTo(marker.getPosition());
        map.setZoom(map.getZoom() + 2);
    } else {
        infoWindow.setContent('<a onclick="navigate(\'#spot/' + marker.data.id + '\');"><img class="type" src="' + icons[marker.data.type].url + '">' + marker.data.title + '</a>');
        infoWindow.setPosition(marker.getPosition());
        infoWindow.open(map);
        getCloseNodes(marker.data.lat, marker.data.lng);
    }
}

function loadAll(data) {
    for (var _marker in markers) {
        markers[_marker].setMap(null);
    }
    markers = [];
    for (var tile in data) {
        for (var entry in data[tile]) {
            load(data[tile][entry]);
        }
    }
}

function initMapInternal() {
    var h = location.hash;
    var bounds = new google.maps.LatLngBounds({ lat: 49, lng: 6 }, { lat: 55, lng: 15 });
    var mapOptions = {
        center: { lat: 51.5167, lng: 9.9167 },
        zoom: 7
    };
    map = new google.maps.Map(_('#map'), mapOptions);

    if (h.startsWith('#map/')) {
        // console.log(h);
        var coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
        map.setCenter({ lat: parseFloat(coords[2]), lng: parseFloat(coords[3]) });
        if (coords[4]) map.setZoom(parseInt(coords[4]));
    } else if (!window.panToPosition) {
        map.setZoom(15);
        map.setCenter({ lat: spots.spot.lat, lng: spots.spot.lng });
    } else {
        map.fitBounds(bounds);
    }

    google.maps.event.addDomListener(window, 'resize', function () {
        var center = map.getCenter();
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
    });

    google.maps.event.addListener(map, 'bounds_changed', function () {
        var bounds = map.getBounds();
        loadBounds(bounds, window.intercept ? window.intercept(window.drawRects, loadAll) : loadAll);
        /*get('//www.parkour.org/map/query3j.php', {latl:bounds.f.f,lath:bounds.f.b,lngl:bounds.b.b,lngh:bounds.b.f,zoom:2}).then(loadAll, function() {
            error(t('error_load_spotmap'));
        });*/
        var center = map.getCenter();
        var coords = '#map/' + center.lat() + '/' + center.lng() + '/' + map.getZoom();
        if (location.hash != coords && (location.hash.startsWith('#map/') || location.hash == '')) {
            history.replaceState({}, '', '#map/' + center.lat().toFixed(5) + '/' + center.lng().toFixed(5) + '/' + map.getZoom());
        }
    });

    google.maps.event.addListener(map, 'click', newMarker);

    var filterDiv = document.createElement('div');
    var filter = new Filter(filterDiv, map);

    filterDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(filterDiv);

    icons.event = {
        url: 'images/green.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 31) };
    icons.group = {
        url: 'images/purple.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 31) };
    icons.spot = {
        url: 'images/logo32.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 31) };
    shapes.spot = {
        coords: [15, 0, 31, 7, 15, 31, 0, 7, 15, 0],
        type: 'poly' };
    icons.zoom = {
        url: 'images/multi.png',
        size: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 8) };
    shapes.zoom = {
        coords: [11, 0, 14, 1, 16, 3, 18, 5, 18, 13, 18, 15, 24, 20, 24, 23, 15, 19, 7, 18, 1, 15, 0, 7, 3, 2, 7, 0, 11, 0],
        type: 'poly' };
    icons.crosshair = {
        url: 'images/crosshair.png',
        size: new google.maps.Size(49, 49),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(24, 24) };

    infoWindow = new google.maps.InfoWindow({
        content: 'Some address here..',
        maxWidth: 500,
        pixelOffset: new google.maps.Size(0, -31)
    });

    track(true);
    //get('./query3j.php', {latl:48.188063481211415,lath:55.51619215717891,lngl:-0.54931640625,lngh:20.54443359375,zoom:2}).then(loadAll);
    restore();
}

function newMarker(event, force) {
    if (!force && isLite) {
        return;
    }
    if (!force && map.getZoom() < 14) {
        success(t('zoom'));
        return;
    }
    if (marker) {
        marker.setPosition(event.latLng);
    } else {
        marker = new google.maps.Marker({
            position: event.latLng,
            map: map,
            title: t('new_marker'),
            icon: icons.crosshair,
            draggable: !isLite,
            data: { category: 'add' }
        });
        marker.addListener('drag', dragMarker);
        marker.addListener('dragend', endMarker);
        marker.addListener('click', show);
        show(marker);
    }
    dragMarker();
    backup();
}
function dragMarker(event) {
    success(t('position') + ': ' + marker.getPosition().lat().toFixed(5) + ' ' + marker.getPosition().lng().toFixed(5));
}
function endMarker(event) {
    map.panTo(marker.getPosition());
    backup();
}
function clickMarker(event) {
    show(marker);
}
window.mapScripts = true;
if (window.mapLoaded) {
    initMapInternal();
}

function Filter(filterDiv, map) {
    filterDiv.className = 'filterDiv';
    var controlUI = document.createElement('div');
    controlUI.className = 'filterBtn';
    controlUI.innerHTML = '&#9881;';
    filterDiv.appendChild(controlUI);
    var filterBox = document.createElement('div');
    filterBox.className = 'filterBox vanish';
    filterDiv.appendChild(filterBox);
    filterBox.innerHTML = 'Zeige:<br /><span class="yes">' + t('spot') + '</span><br /><span class="no">' + t('event') + '</span><br /><span class="yes">' + t('group') + '</span>';

    controlUI.addEventListener('click', function () {
        var elem = _('.filterBox')[0];
        elem.className = elem.className == 'filterBox' ? 'filterBox vanish' : 'filterBox';
        //map.setCenter(chicago);
    });
}
// Source: src/scripts/nav.js
window.nav = window.nav === undefined ? {} : window.nav;
var isLite = false;

function openTab(id, evt) {
    var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _('#' + id).parentNode;

    var sections = _('section');
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].parentNode === parent) {
            if (sections[i].style.display === 'block') {
                console.log('Hiding  ' + sections[i].id);
                if (nav[sections[i].id + '_hide']) {
                    nav[sections[i].id + '_hide'](id == sections[i].id);
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
    if (nav[id + '_show']) {
        nav[id + '_show']();
    }
}
function goTab(id, index) {
    openTab(id, index !== undefined ? { currentTarget: _('button')[index] } : undefined);
}
function resetTab() {
    navigate('');
    // goTab('map', 0);
}
// document.addEventListener('DOMContentLoaded', resetTab);

function notice(text, type) {
    if (window.noticeHideTimeout) {
        noticeHide();
    }
    _('#notice').className = type + ' show';
    _('#notice-text').innerText = text;
    window.noticeHideTimeout = window.setTimeout(noticeHide, 4000);
}
function error(text) {
    notice(text, 'error');
}
function success(text) {
    notice(text, 'success');
}
function noticeHide() {
    var fast = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    _('#notice').className += fast ? ' vanish' : ' hide';
    if (window.noticeHideTimeout) {
        window.clearTimeout(window.noticeHideTimeout);
        delete window.noticeHideTimeout;
    }
}
goTab('map', 0);

window.onhashchange = navigate;

function navigate(h) {
    if (typeof h === 'string') {
        location.hash = h;
        return;
    }
    h = location.hash;
    if (h.startsWith('#event/') || h.startsWith('#group/') || h.startsWith('#move/') || h.startsWith('#page/') || h.startsWith('#post/') || h.startsWith('#spot/')) {
        var match = /#(\w+)\/(\d+)(?:\/(.*))?/g.exec(h);
        if (match[3] == 'lite') {
            _('body')[0].className = 'lite';
            isLite = true;
        }
        loadSpot(match[2]);
    } else if (h.startsWith('#login')) {
        goTab('login', 2);
    } else if (h.startsWith('#search')) {
        goTab('search', 1);
        if (h.startsWith('#search/')) {
            _('#search-text').value = /#(\w+)\/(.*)/g.exec(h)[2];
            loadSearch();
        }
    } else if (h == '' || h.startsWith('#map/')) {
        goTab('map', 0);
        if (h.startsWith('#map/')) {
            var coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            // console.log([coords[2], coords[3], coords[4]]);
            if (map) {
                map.panTo({ lat: parseFloat(coords[2]), lng: parseFloat(coords[3]) });
                if (coords[4]) map.setZoom(parseInt(coords[4]));
            }
        }
    }
}

_('body')[0].onkeyup = function (e) {
    if (e.which == 27) {
        goTab('map', 0);
    }
};
// Source: src/scripts/proximity.js
function getCloseNodes(lat, lng) {
    var bounds = { lat: [lat - 0.0001, lat + 0.0001], lng: [lng - 0.0001, lng + 0.0001] };
    loadBounds(bounds, function (data) {
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
            text += '<a class="entry" onclick="navigate(\'#spot/' + _entry.id + '\');"><img class="type" src="' + icons[_entry.type].url + '">' + _entry.title + '</a>';
        }
        infoWindow.setContent(text);
    });
}
// Source: src/scripts/search.js
var search = {};
_('#search-submit').onclick = function () {
    var text = _('#search-text').value;
    if (/^(0|[1-9]\d*)$/.test(text)) {
        navigate('#spot/' + text);
        //loadSpot(text);
    } else {
        navigate('#search/' + text);
    }
};

function loadSearch() {
    var text = _('#search-text').value;
    if (/^(0|[1-9]\d*)$/.test(text)) {
        navigate('#spot/' + text);
        //loadSpot(text);
    } else {
        search.data = { _format: 'hal_json', status: 'All', type: 'All', title: text, langcode: 'All', page: 0 };
        get('//www.parkour.org/rest/content/node?status=All&type=All&title=&langcode=All&page=0', search.data, { Authorization: false }).then(showPage);
    }
}

function showPage(result) {
    var text2 = '<div class="grid">';
    var text = '';
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = result[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var spot = _step4.value;

            var nid = void 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = find('nid|\\d+|value', spot)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var s = _step5.value;
                    nid = s;
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

            text += '<article onclick="navigate(\'#spot/' + nid + '\');">';
            text2 += '<article onclick="navigate(\'#spot/' + nid + '\');">';

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _s = _step6.value;

                    text2 += '<div class="in-place cover" style="background-image: url(' + _s + ');"></div>';
                    if (_s) break;
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

            text2 += '<div class="in-place title">';
            _('#spot-title').innerText = t('no_title');
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = find('title|\\d+|value', spot)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var _s2 = _step7.value;

                    text += '<h1>' + strip(_s2) + '</h1>';
                    text2 += '<h1><span>' + strip(_s2) + '</span></h1>';
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

            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = find('body|\\d+|value', spot)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _s3 = _step8.value;

                    text += '<p>' + strip(_s3).substring(0, 100) + '</p>';
                    text2 += '<p><span>' + strip(_s3).substring(0, 100) + '</span></p>';
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

            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var _s4 = _step9.value;

                    text += '<img class="spot" src="' + _s4 + '" />';
                    if (_s4) break;
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

            text2 += '</div>';
            text += '</article>';
            text2 += '</article>';
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

    text2 += '</div>';
    _('#search-page').innerHTML = text2;
}
// Source: src/scripts/spot.js
window.nav = window.nav === undefined ? {} : window.nav;

if (!window.spots) window.spots = { spot: {}, marker: {} };

nav.spot_hide = function () {
    _('#map').className = '';
};

function loadSpot(id) {
    get('//www.parkour.org/' + l + '/rest/node/' + id, { _format: 'hal_json' }, { Authorization: false }).then(function (data) {
        spots.spot = { id: id };

        _('#spot-type').innerText = '';
        var _iteratorNormalCompletion10 = true;
        var _didIteratorError10 = false;
        var _iteratorError10 = undefined;

        try {
            for (var _iterator10 = find('\\d+|type|\\d+|target_id', data)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                var s = _step10.value;

                _('#spot').className = 'spot-type-' + s;
                _('#spot-type').innerText = t('type_' + s);
            }
            /* spot */
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
            for (var _iterator11 = find('\\d+|field_spot_type|\\d+|value', data)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                var _s5 = _step11.value;
                _('#spot-type').innerText = t('spot_type_' + _s5);
            } /* move */
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

        var _iteratorNormalCompletion12 = true;
        var _didIteratorError12 = false;
        var _iteratorError12 = undefined;

        try {
            for (var _iterator12 = find('\\d+|field_category|\\d+|value', data)[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                var _s6 = _step12.value;
                _('#spot-type').innerText = t('move_type_' + _s6);
            } /* move */
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
            for (var _iterator13 = find('\\d+|field_move_category|\\d+|value', data)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                var _s7 = _step13.value;
                _('#spot-type').innerText = t('move_type_' + _s7);
            } /* move */
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
            for (var _iterator14 = find('\\d+|field_level|\\d+|value', data)[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                var _s8 = _step14.value;
                _('#spot-type').innerText += ' (' + t('move_type_' + _s8) + ')';
            } /* group */
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
            for (var _iterator15 = find('\\d+|field_group_type|\\d+|value', data)[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                var _s9 = _step15.value;
                _('#spot-type').innerText = t('group_type_' + _s9);
            } /* event */
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
            for (var _iterator16 = find('\\d+|field_event_type|\\d+|value', data)[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                var _s10 = _step16.value;
                _('#spot-type').innerText = t('event_type_' + _s10);
            } // type
            // field_spot_type
            // field_spot_type
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

        _('#spot-title').innerText = t('no_title');
        var _iteratorNormalCompletion17 = true;
        var _didIteratorError17 = false;
        var _iteratorError17 = undefined;

        try {
            for (var _iterator17 = find('\\d+|title|\\d+|value', data)[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                var _s11 = _step17.value;
                _('#spot-title').innerText = _s11;
            }
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

        _('#spot-body').innerText = t('no_body');
        var _iteratorNormalCompletion18 = true;
        var _didIteratorError18 = false;
        var _iteratorError18 = undefined;

        try {
            for (var _iterator18 = find('\\d+|body|\\d+|value', data)[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                var _s12 = _step18.value;
                _('#spot-body').innerHTML = _s12;
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

        var text = '';
        var _iteratorNormalCompletion19 = true;
        var _didIteratorError19 = false;
        var _iteratorError19 = undefined;

        try {
            for (var _iterator19 = find('\\d+|_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', data)[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
                var _s13 = _step19.value;

                text += '<img src="' + _s13 + '" />';
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

        _('#spot-images').innerHTML = text || t('no_images');

        //_('#spot-lat').innerText = 'Keine Standortangabe vorhanden.';
        var _iteratorNormalCompletion20 = true;
        var _didIteratorError20 = false;
        var _iteratorError20 = undefined;

        try {
            for (var _iterator20 = find('\\d+|field_location|\\d+|lat', data)[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
                var _s14 = _step20.value;

                spots.spot.lat = _s14;
                _('#spot-lat').innerHTML = _s14;
            }

            //_('#spot-lng').innerText = 'Keine Standortangabe vorhanden.';
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

        var _iteratorNormalCompletion21 = true;
        var _didIteratorError21 = false;
        var _iteratorError21 = undefined;

        try {
            for (var _iterator21 = find('\\d+|field_location|\\d+|lon', data)[Symbol.iterator](), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
                var _s15 = _step21.value;

                spots.spot.lng = _s15;
                _('#spot-lng').innerHTML = _s15;
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

        goTab('spot');

        if (spots.spot.lat && spots.spot.lng) {
            _('#spot-geo').style.display = 'block';
            _('#spot-map').style.display = 'inline';
            _('#spot-maps-form').style.display = 'inline';
            _('.addHere').forEach(function (item) {
                return item.style.display = 'inline-block';
            });
            _('#spot-maps-formdata').value = spots.spot.lat + ',' + spots.spot.lng;
            //_('#spot-maps-form').action = `//maps.google.de/maps?q=${spots.spot.lat},${spots.spot.lng}`;
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            window.panToPosition = false;
            google.maps.event.addListenerOnce(map, 'idle', function () {
                google.maps.event.trigger(map, 'resize');
                map.setCenter({ lat: spots.spot.lat, lng: spots.spot.lng });
                map.setZoom(15);
            });
            console.log(spots.spot);
            if (isLite) {
                newMarker({ latLng: { lat: spots.spot.lat, lng: spots.spot.lng } }, true);
            }
            google.maps.event.trigger(map, 'resize');
            map.setCenter({ lat: spots.spot.lat, lng: spots.spot.lng });
            map.setZoom(15);
        } else {
            _('#spot-geo').style.display = 'none';
            _('#spot-map').style.display = 'none';
            _('#spot-maps-form').style.display = 'none';
            _('.addHere').forEach(function (item) {
                return item.style.display = 'none';
            });
        }
    }, function (data) {
        console.log(data);
        error(t('error_load_spot'));
    });
}
function find(path, json) {
    var jsons = [json];
    path = path.split('|');
    var _iteratorNormalCompletion22 = true;
    var _didIteratorError22 = false;
    var _iteratorError22 = undefined;

    try {
        for (var _iterator22 = path[Symbol.iterator](), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
            var p = _step22.value;

            var pr = new RegExp('^' + p + '$'),
                list = [];
            var _iteratorNormalCompletion23 = true;
            var _didIteratorError23 = false;
            var _iteratorError23 = undefined;

            try {
                for (var _iterator23 = jsons[Symbol.iterator](), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
                    var j = _step23.value;

                    for (var n in j) {
                        if (j.hasOwnProperty(n)) {
                            if (pr.test(n)) {
                                list.push(j[n]);
                            }
                        }
                    }
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

            jsons = list;
        }
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

    return jsons;
}

_('#spot-map').onclick = function () {
    navigate('');
    map.setCenter({ lat: spots.spot.lat, lng: spots.spot.lng });
    map.setZoom(15);
};

_('#spot-web').onclick = function () {
    location.href = '//www.parkour.org/' + l + '/node/' + spots.spot.id;
};
