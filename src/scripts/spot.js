/* globals l, _, strip, t, ready, Http, Maps, Nav */
const Spot = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./http.js');
    // require('./map.js');
    // require('./nav.js');

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
                text += `<img src="${$.getUrl(s)}" />`;
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
                    Maps.map.setCenter($.spot);
                    Maps.map.setZoom(15);
                });
                console.log($.spot);
                if (Nav.isLite) {
                    Maps.newMarker($.spot, true);
                }
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter($.spot);
                Maps.map.setZoom(15);
            } else {
                _('#spot-geo').style.display = 'none';
                _('#spot-map').style.display = 'none';
                _('#spot-maps-form').style.display = 'none';
                _('.addHere').forEach((item) => item.style.display = 'none');
            }
        }, data => Nav.error(t('error_load_spot')));
    };

    $.getUrl = imageUrl => imageUrl.replace('/sites/default/files/20', '/sites/default/files/styles/grid/public/20');

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
        Maps.map.setCenter($.spot);
        Maps.map.setZoom(15);
    };

    _('#spot-web').onclick = () => {
        location.href = `//www.parkour.org/${l}/node/${$.spot.id}`;
    };
})(Spot);