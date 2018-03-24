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
        Http.get(`//map.parkour.org/api/v1/spot/${id}`, null, {Authorization: false}).then(data => {
            $.spot = {id: id, type: data.spot.type, url_alias: data.spot.url_alias};

            _('#spot-title').innerText = data.spot.title || t('no_title');
            _('#spot').className = `spot-type-${data.spot.type}`;
            _('#spot-type').innerText = t(data.spot_type_detailed);
            let text = '';
            let date = new Date(data.spot.created * 1000).toLocaleString();
            if (data.spot.user_id) {
                text = `${t('node_created_by', data.spot.user_id)} ${t('node_created_by_at', date)}`;
            } else {
                text = `${t('node_created_at', date)}`;
            }
            if (data.spot.changed > data.spot.created) {
                text += `${t('node_changed_at', new Date(data.spot.changed * 1000).toLocaleString())}`;
            }
            _('#spot-meta').innerText = text;
            //data.spot_type_detailed);
            _('#spot-body').innerHTML = data.spot.description || t('no_body');
            _('#spot-lat').innerHTML = data.spot.lat;
            _('#spot-lng').innerHTML = data.spot.lng;
            $.spot.lat = parseFloat(data.spot.lat);
            $.spot.lng = parseFloat(data.spot.lng);
            text = '';
            for (const image of data.images) {
                text += `<img src="//map.parkour.org/images/spots/thumbnails/320px/${image.filename}" />`;
            }
            _('#spot-images').innerHTML = text || t('no_images');

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
                _('.add-here').forEach(item => item.style.display = 'none');
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
        Maps.map.setCenter($.spot);
        Maps.map.setZoom(15);
    };

    _('#spot-web').onclick = () => {
        location.href = `//map.parkour.org/${$.spot.type}/${$.spot.url_alias}`;
    };
})(Spot);