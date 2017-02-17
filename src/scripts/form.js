'use strict';
window.nav = (window.nav === undefined) ? {} : window.nav;

if (!window.spots) window.spots = {spot: {}, marker: {}};

nav.form_show = function() {
    _('#map').style.display = 'block';
    _('#map').className = 'half';
    map.setCenter(marker.getPosition());
    google.maps.event.trigger(map, 'resize');
    google.maps.event.addListenerOnce(map, 'idle', function() {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(marker.getPosition());
    });
};

nav.form_hide = function(isSame) {
    _('#map').className = '';
    if (localStorage.getItem('form_text') && !isSame) {
        success(t('draft_saved'));
    }
};

function add_here(type) {
    newMarker({latLng: {lat: spots.spot.lat, lng: spots.spot.lng}}, true);
    add(type);
}

function add(type) {
    const formTypes = {
        spot: t('new_spot'),
        group: t('new_group'),
        event: t('new_event')
    };
    _('#form-type').innerText = formTypes[type];
    spots.marker = {lat: marker.getPosition().lat(), lng: marker.getPosition().lng(), type: type};
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
        newMarker({latLng: {lat: spots.marker.lat, lng: spots.marker.lng}}, true);
        map.panTo({lat: spots.marker.lat, lng: spots.marker.lng});
        add(spots.marker.type);
        google.maps.event.addListenerOnce(map, 'idle', function() {
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
    get('//www.parkour.org/rest/session/token', undefined, {Authorization: false}).then(function(csrf) {
        success(t('in_progress'));
        post('//www.parkour.org/entity/node?_format=hal_json', JSON.stringify({
            _links: {type: {href: 'http://www.parkour.org/rest/type/node/' + spots.marker.type}},
            type: [{target_id: spots.marker.type}],
            title: [{value: _('#form-title').value}],
            body: [{value: _('#form-text').value}],
            field_location: [{lat: spots.marker.lat, lon: spots.marker.lng, value: 'POINT (' + spots.marker.lng + ' ' + spots.marker.lat + ')'}],
        }), {'Content-Type': 'application/hal+json', 'X-CSRF-Token': csrf.message}).then(function (data) {
            success(t('node_added'));
            location.href = '//www.parkour.org/de/node/' + find('nid|\\d+|value', data)[0] + '/edit';
            remove(true);
        }, function(data) {
            if (data.status == 403 || data.status == 401) {
                error(t('error_forbidden'));
            } else {
                error(t('error_add_node'));
            }
            console.log(data);
        });
    }, function() { error(t('error_add_node')); });
}