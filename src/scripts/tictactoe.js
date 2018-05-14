/* globals ready, Geohash, Geotile, Maps, Nav */
const Tictactoe = {}; ($ => {
    'use strict';
    // require('./base.js');
    // require('./geohash.js');
    // require('./geotile.js');
    // require('./maps.js');
    // require('./nav.js');

    let rects = [];

    ready.push(() => {
        const p = Geotile.loadBounds;
        Geotile.loadBounds = (bounds, callback) => p(bounds, $.intercept($.drawRects, callback));
    });

    $.intercept = (callback1, callback2) => data => {
        callback1(data);
        callback2(data);
    };

    $.drawRects = data => {
        rects.forEach((item) => item.setMap(null));
        rects.length = 0;
        //drawRect(bb, undefined, '#808080');
        let text = [];
        for (const tile in data) {
            const bounds = Geohash.decode(tile);
            $.drawRect(bounds, tile);
            text.push(tile);
        }
        Nav.success(text.join(', '));
    };

    $.drawRect = (b, data, color) => {
        const coords = [
            {lat: b.lat[0], lng: b.lng[0]},
            {lat: b.lat[0], lng: b.lng[1]},
            {lat: b.lat[1], lng: b.lng[1]},
            {lat: b.lat[1], lng: b.lng[0]},
            {lat: b.lat[0], lng: b.lng[0]}
        ];

        color = color || ['#FF0000', '#00FF00', '#0000FF', '#C000C0'][Geohash.BASE32.indexOf(data[data.length - 1]) % 4];

        const obj = new google.maps.Polygon({
            paths: coords,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.35
        });
        if (data) {
            google.maps.event.addListener(obj, "click", () => Nav.success(data));
        }
        obj.setMap(Maps.map);
        rects.push(obj);
        return obj;
    };
})(Tictactoe);