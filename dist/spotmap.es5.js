'use strict';
/*! spotmap - v0.2.7 - 2018-05-16
* https://github.com/windowsfreak/spotmap
* Copyright (c) 2018 Björn Eberhardt; Licensed MIT */

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
    $.dom = function (t) {
        return document.createElement(t);
    };

    $.strip = function (html) {
        var tmp = $.dom('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.html = function (text) {
        var tmp = $.dom('DIV');
        tmp.innerText = text;
        return tmp.innerHTML || '';
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

                if (item.getAttribute('data-translate')) {
                    item[['input', 'textarea', 'select'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.getAttribute('data-translate'));
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

    $.script = function (url, callback) {
        var s = $.dom('script');
        s.type = 'text/javascript';
        s.async = true;
        s.defer = true;
        s.src = url;
        var p = $._('head')[0];
        s.addEventListener('load', function (e) {
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
var Form = {};(function ($) {
    var captchaCode = false;

    var categories = {
        spot: ['outdoor', 'gym', 'parkourpark', 'parkourgym', 'climbinggym', 'pool', 'cliff'],
        event: ['training', 'workshop', 'jam', 'trip', 'competition'],
        group: ['private', 'community', 'club', 'company'],
        move: ['moves', 'conditioning', 'games', 'jumps', 'vaults', 'bar', 'flips', 'combinations', 'freezes', 'beginner', 'intermediate', 'advanced']
    };

    window.captcha = function () {
        grecaptcha.render('form-captcha', {
            'sitekey': '6LdRg1cUAAAAAFjzUokSQB6egcNS_o9EF_KAmW7i',
            'callback': $.save
        });
    };

    ready.push(function () {
        Nav.events.form_show = function () {
            if (!captchaCode) {
                script('https://www.google.com/recaptcha/api.js?onload=captcha&render=explicit');
                captchaCode = true;
            }
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            Maps.map.setCenter(Maps.marker.getPosition());
            google.maps.event.trigger(Maps.map, 'resize');
            google.maps.event.addListenerOnce(Maps.map, 'idle', function () {
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter(Maps.marker.getPosition());
            });
            if (!Http.getUser()) {
                Nav.success(t('error_login_required'));
                Nav.navigate('#login');
            }
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
        _('#form-category').innerHTML = '<option value="" disabled selected hidden>' + t('form_category') + '</option>' + categories[type].map(function (item) {
            return '<option value="' + item + '">' + t(type + '_type_' + item) + '</option>';
        }).join('');
        _('#form-category').value = '';
        Spot.marker = { lat: Maps.marker.getPosition().lat(), lng: Maps.marker.getPosition().lng(), type: type };
        Nav.goTab('form');
    };

    $.backup = function () {
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
        var category = _('#form-category').value;
        if (!category) {
            Nav.error(t('form_category'));
            return;
        }
        var save = function save(token) {
            Nav.success(t('in_progress'));
            var user = Http.getUser();
            Http.post('//map.parkour.org/api/v1/spot', JSON.stringify({
                type: Spot.marker.type,
                category: _('#form-category').value,
                title: _('#form-title').value,
                description: html(_('#form-text').value),
                lat: Spot.marker.lat,
                lng: Spot.marker.lng,
                user_created: user
            }), { 'Content-Type': 'application/json', 'X-CSRF-Token': token, 'X-Username': user }).then(function (data) {
                Nav.success(t('node_added'));
                Nav.navigate('#spot/' + data.id);
                $.remove(true);
            }, function (data) {
                return Nav.error(t(data.status === 403 || data.status === 401 ? 'error_forbidden' : 'error_add_node') + ' ' + data.message);
            });
        };
        var token = grecaptcha.getResponse();
        if (!token) {
            grecaptcha.execute();
        } else {
            save(token);
            grecaptcha.reset();
        }
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
            Http.get('//map.parkour.org/query5j.php', { tiles: tmp.join(','), zoom: zoom }, { Authorization: false }).then(function (data) {
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

    $.display = function (data) {
        _('#help-title').innerText = data.title || '';
        _('#help-body').innerHTML = data.body || '';
        Nav.goTab('help');
    };

    $.show = function (id) {
        return Http.get('./static/' + id + '_' + l + '.json', undefined, { Authorization: false }).then($.display, function (ignored) {
            return Nav.error(t('no_results_found'));
        });
    };

    $.close = function () {
        return Help.previous ? Nav.goTab(Help.previous) : Nav.resetTab();
    };
})(Help);
// Source: src/scripts/http.js
var Http = {};(function ($) {
    $.b64a = function (text) {
        return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    };

    $.retr = function (key) {
        return localStorage.getItem(key);
    };

    $.stor = function (key, value) {
        return localStorage.setItem(key, value);
    };

    $.getUser = function () {
        return localStorage.getItem('d8_user');
    };

    $.getCredentials = function () {
        return 'Basic Og==';
    };

    $.setCredentials = function (user) {
        localStorage.setItem('d8_user', user);
    };

    $.deleteCredentials = function () {
        localStorage.removeItem('d8_user');
    };

    $.http = function (method, url, params) {
        var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

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
        Http.setCredentials(user.value);
        Nav.success(t('logged_in_as', user.value));
        user.value = '';
        Nav.events.login_show();
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

    $.mapped = function (hash) {
        return hash.startsWith('#map/') || hash.startsWith('#spot/');
    };

    var initial = Date.now;
    window.panToPosition = !$.mapped(location.hash);
    $.filter = ['spot', 'event', 'group'];
    var gpsObj = void 0;
    $.icons = {};
    $.shapes = {};

    $.gdpr = function () {
        if (parseInt(Http.retr('gdpr')) !== 1) {
            Help.show('gdpr');
        } else {
            $.accept();
        }
    };

    $.accept = function () {
        if (!window.mapLoaded && !window.mapLoading) {
            script('//maps.google.com/maps/api/js?key=AIzaSyDWsl8SdI_0q21fkJRM6dwxr11uO23bihw&callback=initMap');
            window.mapLoading = true;
        }
        Http.stor('gdpr', 1);
    };

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
            position: position,
            clickable: false
        });
    };

    $.updateGpsObj = function (position) {
        if (!window.mapLoaded) {
            return false;
        }
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
                if (force === 'yes' || !$.mapped(location.hash) || window.panToPosition) {
                    $.pan(position);
                }
            }
        };
        try {
            navigator.geolocation.getCurrentPosition(checkPan, function () {
                return false;
            }, { timeout: 250 });

            navigator.geolocation.getCurrentPosition(checkPan, function () {
                return false;
            }, { enableHighAccuracy: true });
        } catch (ignored) {
            Nav.error('The browser is too old, Geolocation is not supported.'); // TODO translate
        }
    };

    $.markers = {};

    $.load = function (data, list) {
        var multi = data.type.startsWith('multi');
        var marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: multi ? data.title + ' ' + t('btn_spots') + '\n' + data.category.replace(/^multi,/, '').replace(/,/g, ', ') : data.title,
            position: { lat: data.lat, lng: data.lng },
            data: data,
            icon: multi ? $.icons.zoom : data.type.includes('group') ? $.icons.group : data.type.includes('event') ? $.icons.event : $.icons.spot,
            shape: multi ? $.shapes.zoom : $.shapes.spot
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

    var boundsTimer = null;

    $.handleBoundsChanged = function () {
        var bounds = $.map.getBounds();
        Geotile.loadBounds(bounds, $.loadAll);
        clearTimeout(boundsTimer);
        boundsTimer = setTimeout(function () {
            if (location.hash.startsWith('#map/') || location.hash === '') {
                var center = $.map.getCenter();
                var coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
                if (location.hash !== coords) {
                    history.replaceState({}, '', '#map/' + center.lat().toFixed(5) + '/' + center.lng().toFixed(5) + '/' + $.map.getZoom());
                }
            }
        }, 400);
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

        var filterDiv = dom('div');
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
        var controlUI = dom('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        var filterBox = dom('div');
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
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = $.filter[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var f = _step4.value;

                if (entry.type.indexOf(f) !== -1) {
                    return true;
                }
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
                    $.call($.events[sections[i].id + '_hide'], id === sections[i].id);
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
        $.call($.events[id + '_show'], previous);
    };

    $.call = function (func, param) {
        return func && func(param);
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
                _('#search-text').value = decodeURIComponent(/#(\w+)\/(.*)/g.exec(h)[2]);
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
        Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + encodeURIComponent(text));
    };
    _('#search-geocode').onclick = function () {
        var text = _('#search-text').value;
        Maps.geocode(text);
        Nav.navigate('');
    };

    $.loadSearch = function (more) {
        var text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = { search: text, limit: more ? search.data.limit + 25 : 25 };
            Http.get('//map.parkour.org/api/v1/spots/search', search.data, { Authorization: false }).then($.showPage);
        }
    };

    $.showPage = function (result) {
        var text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = result[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var spot = _step5.value;

                text += '<article onclick="Nav.navigate(\'#spot/' + spot.id + '\');">';
                if (spot.p0) {
                    text += '<div class="in-place cover" style="background-image: url(//map.parkour.org/images/spots/thumbnails/320px/' + spot.p0 + ');"></div>';
                }

                text += '<div class="in-place title">';
                text += '<h1><span>' + strip(spot.title) + '</span></h1>';
                text += '<p><span>' + strip(spot.description).substring(0, 100) + '</span></p>';

                text += '</div>';
                text += '</article>';
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

        if (result.length >= search.data.limit) {
            text += '<article onclick="Search.loadSearch(true);"><div class="in-place title"><h1>' + t('search_show_more') + '</h1></div></article>';
        }
        _('#search-page').innerHTML = text + '</div>';
    };
})(Search);
// Source: src/scripts/spot.js
var Spot = {};(function ($) {
    $.spot = {};

    ready.push(function () {
        Nav.events.spot_hide = function () {
            return _('#map').className = '';
        };
        _('#spot-lat').title = t('label_lat');
        _('#spot-lng').title = t('label_lng');
    });

    $.loadSpot = function (id) {
        Http.get('//map.parkour.org/api/v1/spot/' + id, null, { Authorization: false }).then(function (data) {
            var spot = data.spot;
            $.spot = { id: id, type: spot.type, url_alias: spot.url_alias };

            _('#spot-title').innerText = spot.title || '';
            _('#spot').className = 'spot-type-' + spot.type;
            var type = t(spot.type + '_type_' + spot.category);
            if (data.spot_category_details && data.spot_category_details.length) {
                type += ' - ' + data.spot_category_details.map(function (item) {
                    return t('spot_feature_' + item);
                }).join(', ');
            }
            _('#spot-type').innerText = type;
            var text = '';
            var date = new Date(spot.created * 1000).toLocaleString();
            text += spot.user_created ? t('node_created_by', spot.user_created) + ' ' + t('node_created_by_at', date) : '' + t('node_created_at', date);
            if (spot.changed > spot.created) {
                var _date = new Date(spot.changed * 1000).toLocaleString();
                text += spot.user_changed ? t('node_changed_by', spot.user_changed) + ' ' + t('node_changed_by_at', _date) : '' + t('node_changed_at', _date);
            }
            _('#spot-meta').innerText = text;
            _('#spot-body').innerHTML = spot.description || '';
            _('#spot-body').style.display = spot.description ? 'block' : 'none';
            _('#spot-lat').innerHTML = spot.lat;
            _('#spot-lng').innerHTML = spot.lng;
            $.spot.lat = parseFloat(spot.lat);
            $.spot.lng = parseFloat(spot.lng);
            text = '';
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = data.images[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var image = _step6.value;

                    text += '<a href="//map.parkour.org/images/spots/' + image.filename + '" target="_blank" /><img src="//map.parkour.org/images/spots/thumbnails/320px/' + image.filename + '" /></a>';
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

            _('#spot-images').innerHTML = text || '';
            _('#spot-images').style.display = text ? 'block' : 'none';

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
                if (window.mapLoaded) {
                    if (Nav.isLite) {
                        Maps.newMarker($.spot, true);
                    }
                    google.maps.event.addListenerOnce(Maps.map, 'idle', function () {
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
                _('.add-here').forEach(function (item) {
                    return item.style.display = 'none';
                });
            }
        }, function (ignored) {
            return Nav.error(t('error_load_spot'));
        });
    };

    _('#spot-map').onclick = function () {
        if (window.mapLoaded) {
            Nav.navigate('');
            Maps.map.setCenter($.spot);
            Maps.map.setZoom(15);
        }
    };

    _('#spot-web').onclick = function () {
        return location.href = '//map.parkour.org/' + $.spot.type + '/' + $.spot.url_alias;
    };

    _('#spot-edit').onclick = function () {
        return location.href = '//map.parkour.org/' + $.spot.type + '/' + $.spot.url_alias + '/edit';
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
