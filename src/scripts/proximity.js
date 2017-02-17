'use strict';
function getCloseNodes(lat, lng) {
    const bounds = {lat: [lat - 0.0001, lat + 0.0001], lng: [lng - 0.0001, lng + 0.0001]};
    loadBounds(bounds, function(data) {
        let entries = [];
        let order = {spot:0, event:1, group:2}
        for (const tile in data) {
            for (const item in data[tile]) {
                const entry = data[tile][item];
                if (entry.lat > bounds.lat[0] && entry.lat < bounds.lat[1] && entry.lng > bounds.lng[0] && entry.lng < bounds.lng[1]) {
                    entries.push(entry);
                }
            }
        }
        let text = '';
        entries.sort(function(a, b) {
            return order[a.type] - order[b.type];
        });
        for (const item in entries) {
            const entry = entries[item];
            text += `<a class="entry" onclick="navigate('#spot/${entry.id}');"><img class="type" src="${icons[entry.type].url}">${entry.title}</a>`;
        }
        infoWindow.setContent(text);
    });
}