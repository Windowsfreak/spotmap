'use strict';
let rects = [];
function intercept(callback1, callback2) {
    return function(data) {
        callback1(data);
        callback2(data);
    }
}
function drawRects(data) {
    rects.forEach((item) => item.setMap(null));
    rects.length = 0;
    //drawRect(bb, undefined, '#808080');
    let text = [];
    for (const tile in data) {
        const bounds = decodeGeoHash(tile);
        drawRect(bounds, tile);
        text.push(tile);
    }
    success(text.join(', '));
}
function drawRect(b, data, color) {
    const coords = [
        {lat: b.lat[0], lng: b.lng[0]},
        {lat: b.lat[0], lng: b.lng[1]},
        {lat: b.lat[1], lng: b.lng[1]},
        {lat: b.lat[1], lng: b.lng[0]},
        {lat: b.lat[0], lng: b.lng[0]}
    ];

    color = color || ['#FF0000', '#00FF00', '#0000FF', '#C000C0'][BASE32.indexOf(data[data.length-1]) % 4];

    const obj = new google.maps.Polygon({
        paths: coords,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35
    });
    if (data) {
        google.maps.event.addListener(obj, "click", function () {
            success(data);
        });
    }
    obj.setMap(map);
    rects.push(obj);
    return obj;
}