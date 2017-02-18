const Geotile = {}; ($ => {
    'use strict';

    require('./base.js');
    require('./geohash.js');
    require('./http.js');
    require('./nav.js');
    const {Geohash, Http, Nav, t} = window;

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
            Http.get('//www.parkour.org/map/query5j.php', {tiles: tmp.join(','), zoom: zoom}).then(data =>{
                Object.assign(cache[zoom], data);
                Object.assign(result, data);
                callback(result);
            }, () => Nav.error(t('error_load_spotmap')));
        }
        callback(result);
        return result;
    };
})(Geotile);