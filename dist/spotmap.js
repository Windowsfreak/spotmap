'use strict';
/*! spotmap - v0.2.9 - 2018-05-20
* https://github.com/windowsfreak/spotmap
* Copyright (c) 2018 Björn Eberhardt; Licensed MIT */

// Source: src/scripts/base.js
// global
/* globals lang */
($ => {
    $.ready = [];
    $.runLater = () => ($.ready = $.ready.map(item => (typeof item === 'function') && item()).filter(item => item)).length && $.runLater();
    $._ = s => s[0] === '#' ? document.getElementById(s.slice(1)) : document.querySelectorAll(s);
    $.dom = t => document.createElement(t);

    $.strip = html => {
        const tmp = $.dom('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.html = text => {
        const tmp = $.dom('DIV');
        tmp.innerText = text;
        return tmp.innerHTML || '';
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
            if (item.getAttribute('data-translate')) {
                item[['input', 'textarea', 'select'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.getAttribute('data-translate'));
            }
        }
    };

    $.script = (url, callback) => {
        const s = $.dom('script');
        s.type = 'text/javascript';
        s.async = true;
        s.defer = true;
        s.src = url;
        const p = $._('head')[0];
        s.addEventListener('load', e => {
            if (callback) {
                callback(e);
            }
            $.runLater();
        }, false);
        p.appendChild(s);
    };

    $.t_html();
})(window);
// Source: src/scripts/form.js
const Form = {}; ($ => {
    let captchaCode = false;


    window.captcha = () => {
        grecaptcha.render('form-captcha', {
            'sitekey' : '6LdRg1cUAAAAAFjzUokSQB6egcNS_o9EF_KAmW7i',
            'callback' : $.save
        });
    };

    ready.push(() => {
        Nav.events.form_show = () => {
            if (!captchaCode) {
                script('https://www.google.com/recaptcha/api.js?onload=captcha&render=explicit');
                captchaCode = true;
            }
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            Maps.map.setCenter(Maps.marker.getPosition());
            google.maps.event.trigger(Maps.map, 'resize');
            google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter(Maps.marker.getPosition());
            });
            if (!Http.getUser()) {
                Nav.success(t('error_login_required'));
                Nav.navigate('#login');
            }
        };

        Nav.events.form_hide = isSame => {
            _('#map').className = '';
            if (localStorage.getItem('form_text') && !isSame) {
                Nav.success(t('draft_saved'));
            }
        };
    });

    $.add_here = type => {
        Spot.map();
        Maps.newMarker(Spot.spot, true);
        $.add(type);
    };

    $.add = type => {
        const formTypes = {
            spot: t('new_spot'),
            group: t('new_group'),
            event: t('new_event')
        };
        _('#form-type').innerText = formTypes[type];
        _('#form-category').innerHTML = `<option value="" disabled selected hidden>${t('form_category')}</option>` +
            Maps.categories[type].map(item => `<option value="${item}">${t(`${type}_type_${item}`)}</option>`).join('');
        _('#form-category').value = '';
        Spot.marker = {lat: Maps.marker.getPosition().lat(), lng: Maps.marker.getPosition().lng(), type: type};
        Nav.goTab('form');
    };

    $.backup = () => {
        localStorage.setItem('form_title', _('#form-title').value);
        localStorage.setItem('form_text', _('#form-text').value);
        if (Maps.marker) {
            localStorage.setItem('form_lat', Maps.marker.getPosition().lat());
            localStorage.setItem('form_lng', Maps.marker.getPosition().lng());
        }
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
            Maps.newMarker(Spot.marker, true);
            Maps.map.panTo(Spot.marker);
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
        const category = _('#form-category').value;
        if (!category) {
            Nav.error(t('form_category'));
            return;
        }
        const save = token => {
            Nav.success(t('in_progress'));
            const user = Http.getUser();
            Http.post('//map.parkour.org/api/v1/spot', JSON.stringify({
                type: Spot.marker.type,
                category: _('#form-category').value,
                title: _('#form-title').value,
                description: html(_('#form-text').value),
                lat: Spot.marker.lat,
                lng: Spot.marker.lng,
                user_created: user,
            }), {'Content-Type': 'application/json', 'X-CSRF-Token': token, 'X-Username': user}).then(data => {
                Nav.success(t('node_added'));
                Nav.navigate('#spot/' + data.id);
                $.remove(true);
                Geotile.update(Spot.marker.lat, Spot.marker.lng);
                Maps.handleBoundsChanged();
            }, data => Nav.error(t((data.status === 403 || data.status === 401) ? 'error_forbidden' : 'error_add_node') + ' ' + data.message));
        };
        const token = grecaptcha.getResponse();
        if (!token) {
            grecaptcha.execute();
        } else {
            save(token);
            grecaptcha.reset();
        }
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

    $.update = (lat, lng) => {
        const geohash = Geohash.encode(lat, lng);
        for (let i = 0; i < 16; i++) {
            const hash = geohash.substring(0, i);
            for (let z = -1; z <= 5; z++) {
                if (cache[z]) {
                    delete cache[z][hash];
                }
            }
        }
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

        while (len > 0) {
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
            Http.get('//map.parkour.org/query5j.php', {tiles: tmp.join(','), zoom: zoom}, {Authorization: false}).then(data =>{
                Object.assign(cache[zoom], data);
                Object.assign(result, data);
                callback(result);
            }, () => Nav.error(t('error_load_spotmap')));
        }
        callback(result);
        return result;
    };
})(Geotile);
// Source: src/scripts/help.js
const Help = {}; ($ => {
    ready.push(() => Nav.events.help_show = (previous) => $.previous = previous !== 'help' ? previous : $.previous);

    $.display = data => {
        _('#help-title').innerText = data.title || '';
        _('#help-body').innerHTML = data.body || '';
        Nav.goTab('help');
    };

    $.show = id =>
        Http.get(`./static/${id}_${l}.json`, undefined, {Authorization: false}).then($.display, ignored => Nav.error(t('no_results_found')));

    $.close = () => Help.previous ? Nav.goTab(Help.previous) : Nav.resetTab();
})(Help);
// Source: src/scripts/http.js
const Http = {}; ($ => {
    $.b64a = text => btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));

    $.retr = key => localStorage.getItem(key);

    $.stor = (key, value) => localStorage.setItem(key, value);

    $.getUser = () => localStorage.getItem('d8_user');

    $.getCredentials = () => 'Basic Og==';

    $.setCredentials = (user) => {
        localStorage.setItem('d8_user', user);
    };

    $.deleteCredentials = () => {
        localStorage.removeItem('d8_user');
    };

    $.http = function(method, url, params, headers = {}) {
        if (headers.Authorization === false) {
            delete headers.Authorization;
        } else if (headers.user) {
            headers.Authorization = 'Basic ' + $.b64a(headers.user + ':' + headers.pass);
            delete headers.user;
            delete headers.pass;
        } else if (url.match(/^(https?:)?\/\/(www\.)?map\.parkour\.org\/?/)) {
            headers.Authorization = $.getCredentials();
        }
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        resolve(headers.accept === 'text/html' ? xhr.response : JSON.parse(xhr.response));
                    } catch (e) {
                        //xhr.onerror();
                        Nav.error(t('error_server_request'));
                        reject({
                            method,
                            url,
                            params,
                            headers,
                            status: this.status,
                            statusText: xhr.statusText,
                            message: xhr.response
                        });
                    }
                } else {
                    xhr.onerror();
                }
            };
            xhr.onerror = function() {
                Nav.error(t('error_server_request'));
                reject({
                    method,
                    url,
                    params,
                    headers,
                    status: this.status,
                    statusText: xhr.statusText,
                    message: xhr.response
                });
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
        _('#login-submit').onclick = () => {
            let user = _('#login-username');
            Http.setCredentials(user.value);
            Nav.success(t('logged_in_as', user.value));
            user.value = '';
            Nav.events.login_show();
        };
        _('#logout-submit').onclick = () => {
            Http.deleteCredentials();
            Nav.events.login_show();
        };
    });
})(Login);
// Source: src/scripts/maps.js
const Maps = {}; ($ => {
    ready.push(() => {
        Nav.events.map_show = () => {
            if (window.google) {
                const pos = $.map.getCenter();
                google.maps.event.trigger($.map, 'resize');
                $.map.setCenter(pos);
            } else {
                $.gdpr();
            }
        };

        window.mapScripts = true;
        if (window.mapLoaded) {
            $.initMapInternal();
        } else {
            $.gdpr();
        }
    });

    $.mapped = hash => hash.startsWith('#map/') || hash.startsWith('#spot/');

    const initial = Date.now;

    $.categories = {
        spot: [
            'outdoor',
            'gym',
            'parkourpark',
            'parkourgym',
            'climbinggym',
            'pool',
            'cliff'
        ],
        event: [
            'training',
            'workshop',
            'jam',
            'trip',
            'competition'
        ],
        group: [
            'private',
            'community',
            'club',
            'company'
        ],
        move: [
            'moves',
            'conditioning',
            'games',
            'jumps',
            'vaults',
            'bar',
            'flips',
            'combinations',
            'freezes',
            'beginner',
            'intermediate',
            'advanced'
        ]
    };

    window.panToPosition = !$.mapped(location.hash);
    $.filter = Object.values($.categories).reduce((acc, s) => acc.concat(s), []);
    let gpsObj;
    $.icons = {};
    $.shapes = {};

    $.gdpr = () => {
        if (parseInt(Http.retr('gdpr')) !== 1) {
            Help.show('gdpr');
        } else {
            $.accept();
        }
    };

    $.accept = () => {
        if (!window.mapLoaded && !window.mapLoading) {
            script('//maps.google.com/maps/api/js?key=AIzaSyDWsl8SdI_0q21fkJRM6dwxr11uO23bihw&callback=initMap');
            window.mapLoading = true;
        }
        Http.stor('gdpr', 1);
    };

    $.setGpsObj = position => {
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
            position: position,
            clickable: false
        });
    };

    $.updateGpsObj = position => {
        if (!window.mapLoaded) {
            return false;
        }
        if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
            $.setGpsObj(position);
            return true;
        }
        return false;
    };

    $.pan = position => {
        const pan = () => {
            $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
            $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        };
        pan();
        google.maps.event.addListenerOnce($.map, 'idle', pan);
    };

    $.track = force => {
        if (force === 'yes') {
            window.panToPosition = true;
            Nav.goTab('map', 0);
        }
        const checkPan = position => {
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!$.mapped(location.hash) || window.panToPosition)) {
                    $.pan(position);
                }
            }
        };
        try {
            navigator.geolocation.getCurrentPosition(checkPan, () => false, {timeout: 250});

            navigator.geolocation.getCurrentPosition(checkPan, () => false, {enableHighAccuracy: true});
        } catch (ignored) {
            Nav.error('The browser is too old, Geolocation is not supported.'); // TODO translate
        }
    };

    $.markers = {};

    $.load = (data, list) => {
        const multi = data.type.startsWith('multi');
        const marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: multi ? (`${data.title} ${t('btn_spots')}
${data.category.replace(/^multi,/, '').replace(/,/g, ', ')}`) : data.title,
            position: {lat: data.lat, lng: data.lng},
            data: data,
            icon: multi ? $.icons.zoom : (data.type.includes('group') ? $.icons.group : (data.type.includes('event') ? $.icons.event : $.icons.spot)),
            shape: multi ? $.shapes.zoom : $.shapes.spot
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
            const icon = marker.data.type.startsWith('multi') ? $.icons.zoom : (marker.data.type.includes('group') ? $.icons.group : (marker.data.type.includes('event') ? $.icons.event : $.icons.spot));
            $.infoWindow.setContent(`<a onclick="Nav.navigate('#spot/${marker.data.id}');"><img class="type" src="${icon.url}">${marker.data.title}</a>`);
            $.infoWindow.setPosition(marker.getPosition());
            $.infoWindow.open($.map);
            Proximity.getCloseNodes(marker.data.lat, marker.data.lng);
        }
    };

    $.loadAll = data => {
        for (const tile in data) {
            if (!$.markers[tile] || (data[tile] && $.markers[tile].length !== data[tile].length)) {
                const newTile = [];
                for (const entry in data[tile]) {
                    if ($.matchesFilter(data[tile][entry])) {
                        $.load(data[tile][entry], newTile);
                    }
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

    let boundsTimer = null;

    $.handleBoundsChanged = () => {
        const bounds = $.map.getBounds();
        Geotile.loadBounds(bounds, $.loadAll);
        clearTimeout( boundsTimer );
        boundsTimer = setTimeout( function() {
            if (location.hash.startsWith('#map/') || location.hash === '') {
                const center = $.map.getCenter();
                const coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
                if (location.hash !== coords) {
                    history.replaceState({}, '', `#map/${center.lat().toFixed(5)}/${center.lng().toFixed(5)}/${$.map.getZoom()}`);
                }
            }
        }, 400 );
    };

    $.initMapInternal = () => {
        const h = location.hash;
        const bounds = new google.maps.LatLngBounds({lat: 49, lng: 6}, {lat: 55, lng: 15});
        const mapOptions = {
            center: {lat: 51.5167, lng: 9.9167},
            zoom: 7
        };
        $.map = new google.maps.Map(_('#map'), mapOptions);

        $.geocoder = new google.maps.Geocoder();

        if (h.startsWith('#map/')) {
            // console.log(h);
            const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            $.map.setCenter({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
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

        google.maps.event.addDomListener(window, 'resize', () => {
            const center = $.map.getCenter();
            google.maps.event.trigger($.map, 'resize');
            $.map.setCenter(center);
        });

        google.maps.event.addListener($.map, 'bounds_changed', $.handleBoundsChanged);

        google.maps.event.addListener($.map, 'click', $.newMarker);

        const filterDiv = dom('div');
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

        if ((!$.mapped(location.hash) || window.panToPosition)) {
            $.track(true);
        }
        Form.restore();
    };

    $.geocode = address => {
        $.geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                $.newMarker({latLng: results[0].geometry.location}, true);
                $.map.setCenter(results[0].geometry.location);
                $.map.setZoom(15);
            } else {
                Nav.error(`${t('error_geocode')} ${status}`);
            }
        });
    };

    $.newMarker = (event, force) => {
        if (!event.latLng) {
            event.latLng = {lat: event.lat, lng: event.lng};
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

    $.dragMarker = event => Nav.success(`${t('position')}: ${$.marker.getPosition().lat().toFixed(5)} ${$.marker.getPosition().lng().toFixed(5)}`);

    $.endMarker = event => {
        $.map.panTo($.marker.getPosition());
        Form.backup();
    };

    $.clickMarker = event => $.show($.marker);

    $.createFilter = filterDiv => {
        filterDiv.className = 'filterDiv';
        const controlUI = dom('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        const filterBox = dom('div');
        filterBox.className = 'filterBox vanish';
        filterDiv.appendChild(filterBox);
        let s = 'Zeige:<br />';
        for (const [key, value] of Object.entries($.categories)) {
            if (key === 'move') {
                continue;
            }
            s += `<p><b>${t('type_' + key)}</b><br />`;
            for (const v of value) {
                s += `<span class="yes" id="filter-${v}" onclick="Maps.toggleFilter('${v}')">${t(`${key}_type_${v}`)}</span><br />`;
            }
            s += '</p>';
        }
        filterBox.innerHTML = s;
        controlUI.addEventListener('click', () => {
            const elem = _('.filterBox')[0];
            elem.className = elem.className === 'filterBox' ? 'filterBox vanish' : 'filterBox';
        });
    };

    $.toggleFilter = filterType => {
        const elem = _(`#filter-${filterType}`);
        elem.className = (elem.className === 'yes') ? 'no' : 'yes';
        if (elem.className === 'yes') {
            if (!$.filter.includes(filterType)) {
                $.filter.push(filterType);
            }
        } else {
            const i = $.filter.indexOf(filterType);
            if(i !== -1) {
                $.filter.splice(i, 1);
            }
        }
        $.loadAll([]);
        $.handleBoundsChanged();
    };

    $.matchesFilter = entry => {
        for (const f of $.filter) {
            if (entry.category.indexOf(f) !== -1) {
                return true;
            }
        }
        return false;
    };
})(Maps);
// Source: src/scripts/nav.js
const Nav = {}; ($ => {
    $.events = {};
    $.isLite = false;

    $.openTab = (id, evt, parent = _('#' + id).parentNode || _('#content')) => {
        const sections = _('section');
        let previous;
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].parentNode === parent) {
                if (sections[i].style.display === 'block') {
                    previous = sections[i].id;
                    console.log('Hiding  ' + sections[i].id);
                    $.call($.events[sections[i].id + '_hide'], id === sections[i].id);
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

        const obj = _('#' + id);
        if (obj) {
            obj.style.display = 'block';
            parent.className = id + '-page';
            console.log('Showing ' + id);
            $.call($.events[id + '_show'], previous);
        }
        return obj;
    };

    $.call = (func, param) => func && func(param);

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
                _('#search-text').value = decodeURIComponent(/#(\w+)\/(.*)/g.exec(h)[2]);
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
                        Map.map.setZoom(parseInt(coords[4], 10));
                    }
                }
            }
        }
    };

    if (!window.doNotLoad) {
        $.goTab('map', 0);
    }
    ready.push(() => () => {
        document.addEventListener('DOMContentLoaded', $.navigate, false);
        window.onhashchange = $.navigate;
        _('body')[0].onkeyup = e => (e.which !== 27) || $.goTab('map', 0);
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
    ready.push(() => {
        _('#search-submit').onclick = () => {
            const text = _('#search-text').value;
            Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + encodeURIComponent(text));
        };
        _('#search-geocode').onclick = () => {
            const text = _('#search-text').value;
            Maps.geocode(text);
            Nav.navigate('');
        };
    });

    $.loadSearch = more => {
        const text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = {search: text, limit: more ? search.data.limit + 25 : 25};
            Http.get('//map.parkour.org/api/v1/spots/search', search.data, {Authorization: false}).then($.showPage);
        }
    };

    $.showPage = result => {
        let text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        for (const spot of result) {
            text += `<article onclick="Nav.navigate('#spot/${spot.id}');">`;
            if (spot.p0) {
              text += `<div class="in-place cover" style="background-image: url(//map.parkour.org/images/spots/thumbnails/320px/${spot.p0});"></div>`;
            }

            text += '<div class="in-place title">';
            text += `<h1><span>${strip(spot.title)}</span></h1>`;
            text += `<p><span>${strip(spot.description).substring(0, 100)}</span></p>`;

            text += '</div>';
            text += '</article>';
        }
        if (result.length >= search.data.limit) {
            text += `<article onclick="Search.loadSearch(true);"><div class="in-place title"><h1>${t('search_show_more')}</h1></div></article>`;
        }
        _('#search-page').innerHTML = text + '</div>';
    };
})(Search);
// Source: src/scripts/spot.js
const Spot = {}; ($ => {
    $.spot = {};

    ready.push(() => {
        Nav.events.spot_hide = () => _('#map').className = '';
        _('#spot-lat').title = t('label_lat');
        _('#spot-lng').title = t('label_lng');
        _('#spot-map').onclick = $.map;
        _('#spot-edit').onclick = () => location.href = `//map.parkour.org/${$.spot.type}/${$.spot.url_alias}/edit`;
    });

    $.map = () => {
        if (window.mapLoaded) {
            Nav.navigate('');
            Maps.map.setCenter($.spot);
            Maps.map.setZoom(15);
        }
    };

    $.loadSpot = id => {
        Http.get(`//map.parkour.org/api/v1/spot/${id}`, null, {Authorization: false}).then(data => {
            const spot = data.spot;
            $.spot = {id: id, type: spot.type, url_alias: spot.url_alias};

            _('#spot-title').innerText = spot.title || '';
            _('#spot').className = `spot-type-${spot.type}`;
            let type = t(`${spot.type}_type_${spot.category}`);
            if (data.spot_category_details && data.spot_category_details.length) {
                type += ` - ${data.spot_category_details.map(item => t(`spot_feature_${item}`)).join(', ')}`;
            }
            _('#spot-type').innerText = type;
            let text = '';
            const date = new Date(spot.created * 1000).toLocaleString();
            text += spot.user_created ? `${t('node_created_by', spot.user_created)} ${t('node_created_by_at', date)}` : `${t('node_created_at', date)}`;
            if (spot.changed > spot.created) {
                const date = new Date(spot.changed * 1000).toLocaleString();
                text += spot.user_changed ? `${t('node_changed_by', spot.user_changed)} ${t('node_changed_by_at', date)}` : `${t('node_changed_at', date)}`;
            }
            _('#spot-meta').innerText = text;
            _('#spot-body').innerHTML = spot.description || '';
            _('#spot-body').style.display = spot.description ? 'block' : 'none';
            _('#spot-lat').innerHTML = spot.lat;
            _('#spot-lng').innerHTML = spot.lng;
            $.spot.lat = parseFloat(spot.lat);
            $.spot.lng = parseFloat(spot.lng);
            text = '';
            for (const image of data.images) {
                text += `<a href="//map.parkour.org/images/spots/${image.filename}" target="_blank" /><img src="//map.parkour.org/images/spots/thumbnails/320px/${image.filename}" /></a>`;
            }
            _('#spot-images').innerHTML = text || '';
            _('#spot-images').style.display = text ? 'block' : 'none';

            Nav.goTab('spot');

            if ($.spot.lat && $.spot.lng) {
                _('#spot-geo').style.display = 'block';
                _('#spot-map').style.display = 'inline';
                _('#spot-maps-form').style.display = 'inline';
                _('.add-here').forEach(item => item.style.display = 'inline-block');
                _('#spot-maps-formdata').value = `${$.spot.lat},${$.spot.lng}`;
                //_('#spot-maps-form').action = `//maps.google.de/maps?q=${$.spot.lat},${$.spot.lng}`;
                _('#map').style.display = 'block';
                _('#map').className = 'half';
                Maps.panToPosition = false;
                if (window.mapLoaded) {
                    if (Nav.isLite) {
                        Maps.newMarker($.spot, true);
                    }
                    google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                        google.maps.event.trigger(Maps.map, 'resize');
                        Maps.map.setCenter($.spot);
                        Maps.map.setZoom(15);
                    });
                    google.maps.event.trigger(Maps.map, 'resize');
                    Maps.map.setCenter($.spot);
                    Maps.map.setZoom(15);
                }
            } else {
                _('#spot-geo').style.display = 'none';
                _('#spot-map').style.display = 'none';
                _('#spot-maps-form').style.display = 'none';
                _('.add-here').forEach(item => item.style.display = 'none');
            }
        }, ignored => Nav.error(t('error_load_spot')));
    };
})(Spot);
// Source: src/scripts/z.js
(() => {
    if (!window.doNotLoad) {
        window.runLater();
    }
    window.addEventListener("load", () => setTimeout(() => window.scrollTo(0, 1), 0));
})();
