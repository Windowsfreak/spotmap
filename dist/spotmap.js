'use strict';
/*! spotmap - v0.1.0 - 2017-02-18
* https://github.com/windowsfreak/spotmap
* Copyright (c) 2017 Björn Eberhardt; Licensed MIT */

// Source: src/scripts/base.js
// global
/* globals lang */
($ => {
    $.ready = [];
    $.runLater = () => ($.ready = $.ready.map(item => (typeof item === 'function') && item()).filter(item => item)).length && $.runLater();
    $._ = s => s[0] === '#' ? document.getElementById(s.slice(1)) : document.querySelectorAll(s);

    $.strip = html => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.t = (template, field) => {
        if (!lang[template]) {
            console.log(`MISSING: ${template}`);
        }
        return lang[template] ? lang[template].replace('\\1', field) : `MISSING: ${template}`;
    };

    $.setLang = target => {
        localStorage.setItem('lang', target);
        location.reload();
    };

    $.t_html = () => {
        for (const item of $._('*')) {
            if (item.dataset.translate) {
                item[['input', 'textarea'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.dataset.translate);
            }
        }
    };

    $.t_html();
})(window);
// Source: src/scripts/form.js
const Form = {}; ($ => {

    ready.push(() => {
        Nav.events.form_show = () => {
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            Maps.map.setCenter(Maps.marker.getPosition());
            google.maps.event.trigger(Maps.map, 'resize');
            google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter(Maps.marker.getPosition());
            });
        };

        Nav.events.form_hide = isSame => {
            _('#map').className = '';
            if (localStorage.getItem('form_text') && !isSame) {
                Nav.success(t('draft_saved'));
            }
        };
    });

    $.add_here = type => {
        Maps.newMarker({latLng: {lat: Spot.spot.lat, lng: Spot.spot.lng}}, true);
        $.add(type);
    };

    $.add = type => {
        const formTypes = {
            spot: t('new_spot'),
            group: t('new_group'),
            event: t('new_event')
        };
        _('#form-type').innerText = formTypes[type];
        Spot.marker = {lat: Maps.marker.getPosition().lat(), lng: Maps.marker.getPosition().lng(), type: type};
        Nav.goTab('form');
    };

    $.backup = () => {
        localStorage.setItem('form_title', _('#form-title').value);
        localStorage.setItem('form_text', _('#form-text').value);
        localStorage.setItem('form_lat', Maps.marker.getPosition().lat());
        localStorage.setItem('form_lng', Maps.marker.getPosition().lng());
        if (Spot.marker) {
            localStorage.setItem('form_type', Spot.marker.type);
        }
    };

    $.restore = () => {
        if (localStorage.getItem('form_text')) {
            _('#form-title').value = localStorage.getItem('form_title');
            _('#form-text').value = localStorage.getItem('form_text');
            Spot.marker = {
                lat: parseFloat(localStorage.getItem('form_lat')),
                lng: parseFloat(localStorage.getItem('form_lng')),
                type: localStorage.getItem('form_type')
            };
            window.panToPosition = false;
            Maps.newMarker({latLng: {lat: Spot.marker.lat, lng: Spot.marker.lng}}, true);
            Maps.map.panTo({lat: Spot.marker.lat, lng: Spot.marker.lng});
            $.add(Spot.marker.type);
            google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                Maps.map.panTo(Maps.marker.getPosition());
            });
            Nav.success(t('draft_restored'));
        }
    };

    $.remove = silent => {
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

    $.save = () => {
        Http.get('//www.parkour.org/rest/session/token', undefined, {Authorization: false}).then(csrf => {
            Nav.success(t('in_progress'));
            Http.post('//www.parkour.org/entity/node?_format=hal_json', JSON.stringify({
                _links: {type: {href: 'http://www.parkour.org/rest/type/node/' + Spot.marker.type}},
                type: [{target_id: Spot.marker.type}],
                title: [{value: _('#form-title').value}],
                body: [{value: _('#form-text').value}],
                field_location: [{
                    lat: Spot.marker.lat,
                    lon: Spot.marker.lng,
                    value: 'POINT (' + Spot.marker.lng + ' ' + Spot.marker.lat + ')'
                }],
            }), {'Content-Type': 'application/hal+json', 'X-CSRF-Token': csrf.message}).then(data => {
                Nav.success(t('node_added'));
                location.href = '//www.parkour.org/de/node/' + Spot.find('nid|\\d+|value', data)[0] + '/edit';
                $.remove(true);
            }, data => Nav.error(t((data.status === 403 || data.status === 401) ? 'error_forbidden' : 'error_add_node')));
        }, () => Nav.error(t('error_add_node')));
    };
})(Form);
// Source: src/scripts/geohash.js
const Geohash = {}; ($ => {
// Geohash library for Javascript
    // (c) 2008 David Troy
    // Distributed under the MIT License

    $.BITS = [16, 8, 4, 2, 1];

    $.BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    $.NEIGHBORS = {
        right: {even: "bc01fg45238967deuvhjyznpkmstqrwx"},
        left: {even: "238967debc01fg45kmstqrwxuvhjyznp"},
        top: {even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy"},
        bottom: {even: "14365h7k9dcfesgujnmqp0r2twvyx8zb"}
    };
    $.BORDERS = {
        right: {even: "bcfguvyz"},
        left: {even: "0145hjnp"},
        top: {even: "prxz"},
        bottom: {even: "028b"}
    };

    $.NEIGHBORS.bottom.odd = $.NEIGHBORS.left.even;
    $.NEIGHBORS.top.odd = $.NEIGHBORS.right.even;
    $.NEIGHBORS.left.odd = $.NEIGHBORS.bottom.even;
    $.NEIGHBORS.right.odd = $.NEIGHBORS.top.even;

    $.BORDERS.bottom.odd = $.BORDERS.left.even;
    $.BORDERS.top.odd = $.BORDERS.right.even;
    $.BORDERS.left.odd = $.BORDERS.bottom.even;
    $.BORDERS.right.odd = $.BORDERS.top.even;

    $.refineInterval = (interval, cd, mask) => interval[(cd & mask) ? 0 : 1] = (interval[0] + interval[1]) / 2;

    $.adjacent = (srcHash, dir) => {
        srcHash = srcHash.toLowerCase();
        const lastChr = srcHash.charAt(srcHash.length - 1);
        const type = (srcHash.length % 2) ? 'odd' : 'even';
        const base = srcHash.substring(0, srcHash.length - 1);
        return (($.BORDERS[dir][type].indexOf(lastChr) !== -1) ? $.adjacent(base, dir) : base) + $.BASE32[$.NEIGHBORS[dir][type].indexOf(lastChr)];
    };

    $.decode = geohash => {
        let is_even = 1;
        const lat = [];
        const lon = [];
        lat[0] = -90.0;
        lat[1] = 90.0;
        lon[0] = -180.0;
        lon[1] = 180.0;
        let lat_err = 90.0;
        let lon_err = 180.0;

        for (let i = 0; i < geohash.length; i++) {
            const c = geohash[i];
            const cd = $.BASE32.indexOf(c);
            for (let j = 0; j < 5; j++) {
                const mask = $.BITS[j];
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

        return {lat: lat, lng: lon};
    };

    $.encode = (latitude, longitude) => {
        let is_even = 1;
        const lat = [];
        const lon = [];
        let bit = 0;
        let ch = 0;
        const precision = 12;
        let geohash = "";

        lat[0] = -90.0;
        lat[1] = 90.0;
        lon[0] = -180.0;
        lon[1] = 180.0;

        while (geohash.length < precision) {
            if (is_even) {
                const mid = (lon[0] + lon[1]) / 2;
                if (longitude > mid) {
                    ch |= $.BITS[bit];
                    lon[0] = mid;
                } else {
                    lon[1] = mid;
                }
            } else {
                const mid = (lat[0] + lat[1]) / 2;
                if (latitude > mid) {
                    ch |= $.BITS[bit];
                    lat[0] = mid;
                } else {
                    lat[1] = mid;
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
const Geotile = {}; ($ => {

    const cache = {};
    const g_size = [
        [180, 360],
        [45, 45],
        [5.625, 11.25],
        [1.40625, 1.40625],
        [0.17578125, 0.3515625],
        [0.0439453125, 0.0439453125],
        [0.0054931640625, 0.010986328125],
        [0.001373291015625, 0.001373291015625],
        [0.000171661376953125, 0.00034332275390625],
        [0.00004291534423828125, 0.00004291534423828125],
        [0.000005364418029785156, 0.000010728836059570312],
        [0.000001341104507446289, 0.000001341104507446289],
        [1.6763806343078613e-7, 3.3527612686157227e-7]
    ];

    $.onlyUnique = (value, index, self) => self.indexOf(value) === index;

    $.extend = (matrix, dir) => {
        const matrix2 = matrix.slice(0);
        for (const value of matrix2) {
            matrix.push(Geohash.adjacent(value, dir));
        }
        return matrix.filter($.onlyUnique);
    };

    $.filter = (obj, predicate) => {
        const result = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const tmp = predicate(key, obj[key]);
                if (tmp !== undefined) {
                    result[key] = tmp;
                }
            }
        }

        return result;
    };

    $.loadBounds = (bounds, callback) => {
        let b;
        if (bounds.lat) {
            b = bounds;
        } else {
            b = {sw: bounds.getSouthWest(), ne: bounds.getNorthEast()};
            b = {lat: [b.sw.lat(), b.ne.lat()], lng: [b.sw.lng(), b.ne.lng()]};
        }
        let c = {lat: b.lat.slice(0), lng: b.lng.slice(0)};
        if (c.lng[1] < c.lng[0]) {
            c.lng[1] += 360;
        }
        if (c.lng[0] + c.lng[1] > 360) {
            c.lng[1] -= 360;
            c.lng[0] -= 360;
        }
        const d = [c.lat[1] - c.lat[0], c.lng[1] - c.lng[0]];

        let zoom;
        const zx = Math.min(d[0], d[1]);
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

        let len = 12;

        while (len-- > 0) {
            if (g_size[len][0] > d[0] / 3 && g_size[len][1] > d[1] / 3) {
                break;
            }
        }

        len++;
        let matrix;

        while (true) {
            len--;

            const size = g_size[len];

            let center = Geohash.encode((c.lat[0] + c.lat[1]) / 2, (c.lng[0] + c.lng[1]) / 2);
            const p = center.substring(0, len);

            matrix = [p];

            let q = Geohash.decode(p);
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

        const result = {};
        for (const i of matrix) {
            result[i] = cache[zoom][i];
        }

        let tmp = Object.keys($.filter(result, (key, val) => (val === undefined) ? key : undefined)).map(key => key);
        if (tmp.length) {
            Http.get('//www.parkour.org/map/query5j.php', {tiles: tmp.join(','), zoom: zoom}, {Authorization: false}).then(data =>{
                Object.assign(cache[zoom], data);
                Object.assign(result, data);
                callback(result);
            }, () => Nav.error(t('error_load_spotmap')));
        }
        callback(result);
        return result;
    };
})(Geotile);
// Source: src/scripts/http.js
const Http = {}; (function($) {

    $.b64a = text => btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));

    $.getUser = () => localStorage.getItem('d8_user');

    $.getCredentials = () => localStorage.getItem('d8_auth') || 'Basic Og==';

    $.setCredentials = (user, pass) => {
        localStorage.setItem('d8_user', user);
        localStorage.setItem('d8_auth', 'Basic ' + $.b64a(user + ':' + pass));
    };

    $.deleteCredentials = () => {
        localStorage.removeItem('d8_user');
        localStorage.removeItem('d8_auth');
    };

    $.http = function(method, url, params, headers = {}) {
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
            const xhr = new XMLHttpRequest();
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
            xhr.onerror = () => {
                Nav.error(t('error_server_request'));
                const data = {
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
                Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
            }
            // stringify params if object:
            if (params && typeof params === 'object') {
                xhr.send(Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&'));
            } else {
                xhr.send(params);
            }
        });
    };

    $.get = (url, params, headers) => {
        if (params && typeof params === 'object') {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&'), undefined, headers);
        } else if (params) {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + params, undefined, headers);
        } else {
            return $.http('GET', url, params, headers);
        }
    };
    $.post = (url, params, headers) => $.http('POST', url, params, headers);
    $.patch = (url, params, headers) => $.http('PATCH', url, params, headers);
    $.del = (url, params, headers) => $.http('REMOVE', url, params, headers);
})(Http);
// Source: src/scripts/login.js
const Login = {}; ($ => {

    ready.push(() => {
        Nav.events.login_show = () => {
            if (Http.getUser() !== null) {
                Nav.goTab('logout-form');
                _('#username').innerText = Http.getUser();
            } else {
                Nav.goTab('login-form');
            }
        };
    });

    _('#login-submit').onclick = () => {
        let user = _('#login-username');
        let pass = _('#login-password');
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

    _('#logout-submit').onclick = () => {
        Http.deleteCredentials();
        Nav.events.login_show();
    };
})(Login);
// Source: src/scripts/maps.js
const Maps = {}; (function($) {

    ready.push(() => {
        Nav.events.map_show = () => {
            if (window.google) {
                const pos = $.map.getCenter();
                google.maps.event.trigger($.map, 'resize');
                $.map.setCenter(pos);
            }
        };

        window.mapScripts = true;
        if (window.mapLoaded) {
            $.initMapInternal();
        }
    });


    const initial = Date.now;
    $.panToPosition = !location.hash.startsWith('#map/');
    let gpsObj;
    $.icons = {};
    $.shapes = {};

    $.setGpsObj = function(position) {
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
            center: {lat: position.coords.latitude, lng: position.coords.longitude},
            radius: position.coords.accuracy,
            position: position
        });
    };

    $.updateGpsObj = function(position) {
        if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
            $.setGpsObj(position);
            return true;
        }
        return false;
    };

    $.pan = function(position) {
        $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
        $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        google.maps.event.addListenerOnce($.map, 'idle', function () {
            $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
            $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        });
    };

    $.afterTrack = function() {
        //_('button')[3].blur();
        //goTab('map', 0);
    };

    $.track = function(force) {
        if (force === 'yes') {
            window.panToPosition = true;
            Nav.goTab('map', 0);
        }
        navigator.geolocation.getCurrentPosition(function (position) {
            //$.marker.setPosition({lat: position.coords.latitude, lng: position.coords.longitude});
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!location.hash.startsWith('#map') && window.panToPosition)) {
                    $.pan(position);
                }
            }
        }, function () {
            // console.log('error1', arguments);
        }, {timeout: 250});

        navigator.geolocation.getCurrentPosition(function (position) {
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!location.hash.startsWith('#map') && window.panToPosition)) {
                    $.pan(position);
                }
            }
            $.afterTrack();
        }, function () {
            // console.log('error2', arguments);
            $.afterTrack();
        }, {enableHighAccuracy: true});
    };

    $.markers = {};

    $.load = function(data, list) {
        const marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: '' + data.title,
            position: {lat: data.lat, lng: data.lng},
            data: data,
            icon: data.type.startsWith('multi') ? $.icons.zoom : (data.type.includes('group') ? $.icons.group : (data.type.includes('event') ? $.icons.event : $.icons.spot)),
            shape: data.type.startsWith('multi') ? $.shapes.zoom : $.shapes.spot
        });
        list.push(marker);

        google.maps.event.addListener(marker, 'click', $.show);
    };

    $.show = function(marker) {
        if (!marker || marker.latLng || marker.pixel) {
            marker = this;
        }
        if (marker.data.category === 'add') {
            if (Nav.isLite) {
                return;
            }
            $.map.panTo(marker.getPosition());
            $.infoWindow.setContent(`
            <button type="button" onclick="Form.add('spot')">&#x2795; ${t('spot')}</button>
            <button type="button" onclick="Form.add('event')">&#x2795; ${t('event')}</button>
            <button type="button" onclick="Form.add('group')">&#x2795; ${t('group')}</button>`);
            $.infoWindow.open($.map, marker);
        } else if (marker.data.category.startsWith('multi')) {
            $.infoWindow.close();
            $.map.panTo(marker.getPosition());
            $.map.setZoom($.map.getZoom() + 2);
        } else {
            $.infoWindow.setContent(`<a onclick="Nav.navigate('#spot/${marker.data.id}');"><img class="type" src="${$.icons[marker.data.type].url}">${marker.data.title}</a>`);
            $.infoWindow.setPosition(marker.getPosition());
            $.infoWindow.open($.map);
            Proximity.getCloseNodes(marker.data.lat, marker.data.lng);
        }
    };

    $.loadAll = function(data) {
        for (const tile in data) {
            if (!$.markers[tile] || (data[tile] && $.markers[tile].length !== data[tile].length)) {
                const newTile = [];
                for (const entry in data[tile]) {
                    $.load(data[tile][entry], newTile);
                }
                if ($.markers[tile]) {
                    for (const marker in $.markers[tile]) {
                        $.markers[tile][marker].setMap(null);
                    }
                }
                $.markers[tile] = newTile;
            }
        }
        for (const tile in $.markers) {
            if (!data[tile]) {
                for (const marker in $.markers[tile]) {
                    $.markers[tile][marker].setMap(null);
                }
                delete $.markers[tile];
            }
        }
    };

    $.initMapInternal = function() {
        const h = location.hash;
        const bounds = new google.maps.LatLngBounds({lat: 49, lng: 6}, {lat: 55, lng: 15});
        const mapOptions = {
            center: {lat: 51.5167, lng: 9.9167},
            zoom: 7
        };
        $.map = new google.maps.Map(_('#map'), mapOptions);

        if (h.startsWith('#map/')) {
            // console.log(h);
            const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            $.map.setCenter({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
            if (coords[4]) {
                $.map.setZoom(parseInt(coords[4]));
            }
        } else if (!window.panToPosition) {
            $.map.setZoom(15);
            if (typeof Spot.spot.lat !== 'undefined') {
                $.map.setCenter({lat: Spot.spot.lat, lng: Spot.spot.lng});
            }
        } else {
            $.map.fitBounds(bounds);
        }

        google.maps.event.addDomListener(window, 'resize', function () {
            const center = $.map.getCenter();
            google.maps.event.trigger($.map, 'resize');
            $.map.setCenter(center);
        });

        google.maps.event.addListener($.map, 'bounds_changed', function () {
            const bounds = $.map.getBounds();
            Geotile.loadBounds(bounds, $.loadAll);
            const center = $.map.getCenter();
            const coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
            if (location.hash !== coords && (location.hash.startsWith('#map/') || location.hash === '')) {
                history.replaceState({}, '', `#map/${center.lat().toFixed(5)}/${center.lng().toFixed(5)}/${$.map.getZoom()}`);
            }
        });

        google.maps.event.addListener($.map, 'click', $.newMarker);

        const filterDiv = document.createElement('div');
        const filter = new $.Filter(filterDiv, $.map);

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

    $.newMarker = function(event, force) {
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
                data: {category: 'add'}
            });
            $.marker.addListener('drag', $.dragMarker);
            $.marker.addListener('dragend', $.endMarker);
            $.marker.addListener('click', $.show);
            $.show($.marker);
        }
        $.dragMarker();
        Form.backup();
    };

    $.dragMarker = function(event) {
        Nav.success(`${t('position')}: ${$.marker.getPosition().lat().toFixed(5)} ${$.marker.getPosition().lng().toFixed(5)}`);
    };

    $.endMarker = function(event) {
        $.map.panTo($.marker.getPosition());
        Form.backup();
    };

    $.clickMarker = function(event) {
        $.show($.marker);
    };

    $.Filter = function(filterDiv, map) {
        filterDiv.className = 'filterDiv';
        const controlUI = document.createElement('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        const filterBox = document.createElement('div');
        filterBox.className = 'filterBox vanish';
        filterDiv.appendChild(filterBox);
        filterBox.innerHTML = `Zeige:<br /><span class="yes">${t('spot')}</span><br /><span class="no">${t('event')}</span><br /><span class="yes">${t('group')}</span>`;

        controlUI.addEventListener('click', function () {
            const elem = _('.filterBox')[0];
            elem.className = elem.className === 'filterBox' ? 'filterBox vanish' : 'filterBox';
            //map.setCenter(chicago);
        });
    };

})(Maps);
// Source: src/scripts/nav.js
const Nav = {}; ($ => {
    $.events = {};
    $.isLite = false;

    $.openTab = (id, evt, parent = _('#' + id).parentNode) => {
        const sections = _('section');
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].parentNode === parent) {
                if (sections[i].style.display === 'block') {
                    console.log('Hiding  ' + sections[i].id);
                    if ($.events[sections[i].id + '_hide']) {
                        $.events[sections[i].id + '_hide'](id === sections[i].id);
                    }
                }
                sections[i].style.display = 'none';
            }
        }

        if (evt) {
            const buttons = _('button');
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].className = buttons[i].className.replace(' active', '');
            }
            evt.currentTarget.className += ' active';
        }

        _('#' + id).style.display = 'block';
        console.log('Showing ' + id);
        if ($.events[id + '_show']) {
            $.events[id + '_show']();
        }
    };

    $.goTab = (id, index) => $.openTab(id, index !== undefined ? {currentTarget: _('button')[index]} : undefined);
    $.resetTab = () => $.navigate('');

    $.notice = (text, type) => {
        if (window.noticeHideTimeout) {
            $.noticeHide();
        }
        _('#notice').className = type + ' show';
        _('#notice-text').innerText = text;
        window.noticeHideTimeout = window.setTimeout($.noticeHide, 4000);
    };
    $.error = text => $.notice(text, 'error');
    $.success = text => $.notice(text, 'success');

    $.noticeHide = fast => {
        _('#notice').className += fast ? ' vanish' : ' hide';
        if (window.noticeHideTimeout) {
            window.clearTimeout(window.noticeHideTimeout);
            delete window.noticeHideTimeout;
        }
    };

    $.navigate = h => {
        if (typeof h === 'string') {
            location.hash = h;
            return;
        }
        h = location.hash;
        if (h.startsWith('#event/') || h.startsWith('#group/') || h.startsWith('#move/') || h.startsWith('#page/') || h.startsWith('#post/') || h.startsWith('#spot/')) {
            const match = /#(\w+)\/(\d+)(?:\/(.*))?/g.exec(h);
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
                const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
                // console.log([coords[2], coords[3], coords[4]]);
                if (Map.map) {
                    Map.map.panTo({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
                    if (coords[4]) {
                        Map.map.setZoom(parseInt(coords[4]));
                    }
                }
            }
        }
    };

    $.goTab('map', 0);
    _('body')[0].onkeyup = e => (e.which !== 27) || $.goTab('map', 0);
    ready.push(() => () => {
        document.addEventListener('DOMContentLoaded', $.navigate, false);
        window.onhashchange = $.navigate;
    });

})(Nav);
// Source: src/scripts/proximity.js
const Proximity = {}; ($ => {
    $.getCloseNodes = (lat, lng) => {
        const bounds = {lat: [lat - 0.0001, lat + 0.0001], lng: [lng - 0.0001, lng + 0.0001]};
        Geotile.loadBounds(bounds, data => {
            let entries = [];
            let order = {spot: 0, event: 1, group: 2};
            for (const tile in data) {
                for (const item in data[tile]) {
                    const entry = data[tile][item];
                    if (entry.lat > bounds.lat[0] && entry.lat < bounds.lat[1] && entry.lng > bounds.lng[0] && entry.lng < bounds.lng[1]) {
                        entries.push(entry);
                    }
                }
            }
            let text = '';
            entries.sort((a, b) => order[a.type] - order[b.type]);
            for (const item in entries) {
                const entry = entries[item];
                text += `<a class="entry" onclick="Nav.navigate('#spot/${entry.id}');"><img class="type" src="${Maps.icons[entry.type].url}">${entry.title}</a>`;
            }
            if (text !== '') {
                Maps.infoWindow.setContent(text);
            }
        });
    };
})(Proximity);
// Source: src/scripts/search.js
const Search = {}; ($ => {
    const search = {};
    _('#search-submit').onclick = () => {
        const text = _('#search-text').value;
        Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + text);
    };

    $.loadSearch = () => {
        const text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = {_format: 'hal_json', status: 'All', type: 'All', title: text, langcode: 'All', page: 0};
            Http.get('//www.parkour.org/rest/content/node?status=All&type=All&title=&langcode=All&page=0', search.data, {Authorization: false}).then($.showPage);
        }
    };

    $.showPage = result => {
        let text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        for (const spot of result) {
            let nid;
            for (const s of Spot.find('nid|\\d+|value', spot)) {
                nid = s;
            }
            text += `<article onclick="Nav.navigate('#spot/${nid}');">`;

            for (const s of Spot.find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)) {
                text += `<div class="in-place cover" style="background-image: url(${s});"></div>`;
                if (s) {
                    break;
                }
            }

            text += '<div class="in-place title">';
            _('#spot-title').innerText = t('no_title');
            for (const s of Spot.find('title|\\d+|value', spot)) {
                text += `<h1><span>${strip(s)}</span></h1>`;
            }

            for (const s of Spot.find('body|\\d+|value', spot)) {
                text += `<p><span>${strip(s).substring(0, 100)}</span></p>`;
            }

            text += '</div>';
            text += '</article>';
        }
        text += '</div>';
        _('#search-page').innerHTML = text;
    };
})(Search);
// Source: src/scripts/spot.js
const Spot = {}; ($ => {

    $.spot = {};

    ready.push(() => Nav.events.spot_hide = () => _('#map').className = '');

    $.loadSpot = id => {
        Http.get(`//www.parkour.org/${l}/rest/node/${id}`, {_format: 'hal_json'}, {Authorization: false}).then(data => {
            $.spot = {id: id};

            _('#spot-type').innerText = '';
            for (const s of $.find('\\d+|type|\\d+|target_id', data)) {
                _('#spot').className = `spot-type-${s}`;
                _('#spot-type').innerText = t(`type_${s}`);
            }
            /* spot */
            for (const s of $.find('\\d+|field_spot_type|\\d+|value', data)) {
                _('#spot-type').innerText = t(`spot_type_${s}`);
            }
            /* move */
            for (const s of $.find('\\d+|field_category|\\d+|value', data)) {
                _('#spot-type').innerText = t(`move_type_${s}`);
            }
            /* move */
            for (const s of $.find('\\d+|field_move_category|\\d+|value', data)) {
                _('#spot-type').innerText = t(`move_type_${s}`);
            }
            /* move */
            for (const s of $.find('\\d+|field_level|\\d+|value', data)) {
                _('#spot-type').innerText += ` (${t('move_type_' + s)})`;
            }
            /* group */
            for (const s of $.find('\\d+|field_group_type|\\d+|value', data)) {
                _('#spot-type').innerText = t(`group_type_${s}`);
            }
            /* event */
            for (const s of $.find('\\d+|field_event_type|\\d+|value', data)) {
                _('#spot-type').innerText = t(`event_type_${s}`);
            }

            _('#spot-title').innerText = t('no_title');
            for (const s of $.find('\\d+|title|\\d+|value', data)) {
                _('#spot-title').innerText = s;
            }

            _('#spot-body').innerText = t('no_body');
            for (const s of $.find('\\d+|body|\\d+|value', data)) {
                _('#spot-body').innerHTML = s;
            }

            let text = '';
            for (const s of $.find('\\d+|_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', data)) {
                text += `<img src="${s}" />`;
            }
            _('#spot-images').innerHTML = text || t('no_images');

            //_('#spot-lat').innerText = 'Keine Standortangabe vorhanden.';
            for (const s of $.find('\\d+|field_location|\\d+|lat', data)) {
                $.spot.lat = s;
                _('#spot-lat').innerHTML = s;
            }

            //_('#spot-lng').innerText = 'Keine Standortangabe vorhanden.';
            for (const s of $.find('\\d+|field_location|\\d+|lon', data)) {
                $.spot.lng = s;
                _('#spot-lng').innerHTML = s;
            }

            Nav.goTab('spot');

            if ($.spot.lat && $.spot.lng) {
                _('#spot-geo').style.display = 'block';
                _('#spot-map').style.display = 'inline';
                _('#spot-maps-form').style.display = 'inline';
                _('.addHere').forEach((item) => item.style.display = 'inline-block');
                _('#spot-maps-formdata').value = `${$.spot.lat},${$.spot.lng}`;
                //_('#spot-maps-form').action = `//maps.google.de/maps?q=${$.spot.lat},${$.spot.lng}`;
                _('#map').style.display = 'block';
                _('#map').className = 'half';
                Maps.panToPosition = false;
                google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                    google.maps.event.trigger(Maps.map, 'resize');
                    Maps.map.setCenter({lat: $.spot.lat, lng: $.spot.lng});
                    Maps.map.setZoom(15);
                });
                console.log($.spot);
                if (Nav.isLite) {
                    Maps.newMarker({latLng: {lat: $.spot.lat, lng: $.spot.lng}}, true);
                }
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter({lat: $.spot.lat, lng: $.spot.lng});
                Maps.map.setZoom(15);
            } else {
                _('#spot-geo').style.display = 'none';
                _('#spot-map').style.display = 'none';
                _('#spot-maps-form').style.display = 'none';
                _('.addHere').forEach((item) => item.style.display = 'none');
            }
        }, data => Nav.error(t('error_load_spot')));
    };

    $.find = (path, json) => {
        let jsons = [json];
        path = path.split('|');
        for (const p of path) {
            const pr = new RegExp(`^${p}$`), list = [];
            for (const j of jsons) {
                for (const n in j) {
                    if (j.hasOwnProperty(n)) {
                        if (pr.test(n)) {
                            list.push(j[n]);
                        }
                    }
                }
            }
            jsons = list;
        }
        return jsons;
    };

    _('#spot-map').onclick = () => {
        Nav.navigate('');
        Maps.map.setCenter({lat: $.spot.lat, lng: $.spot.lng});
        Maps.map.setZoom(15);
    };

    _('#spot-web').onclick = () => {
        location.href = `//www.parkour.org/${l}/node/${$.spot.id}`;
    };
})(Spot);
// Source: src/scripts/z.js
(() => window.runLater())();