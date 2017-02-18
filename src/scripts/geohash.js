const Geohash = {}; ($ => {
    'use strict';
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