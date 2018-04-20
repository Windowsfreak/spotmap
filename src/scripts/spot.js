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
            const spot = data.spot;
            $.spot = {id: id, type: spot.type, url_alias: spot.url_alias};

            _('#spot-title').innerText = spot.title || t('no_title');
            _('#spot').className = `spot-type-${spot.type}`;
            let type = t(`${spot.type}_type_${spot.category}`);
            if (data.spot_category_details && data.spot_category_details.length) {
                type += ` - ${data.spot_category_details.map(item => t(`spot_feature_${item}`)).join(', ')}`;
            }
            _('#spot-type').innerText = type;
            let text = '';
            const date = new Date(spot.created * 1000).toLocaleString();
            if (spot.user_created) {
                text = `${t('node_created_by', spot.user_created)} ${t('node_created_by_at', date)}`;
            } else {
                text = `${t('node_created_at', date)}`;
            }
            if (spot.changed > spot.created) {
                const date = new Date(spot.changed * 1000).toLocaleString();
                if (spot.user_changed) {
                    text += `${t('node_changed_by', spot.user_changed)} ${t('node_changed_by_at', date)}`;
                } else {
                  text += `${t('node_changed_at', date)}`;
                }
            }
            _('#spot-meta').innerText = text;
            _('#spot-body').innerHTML = spot.description || t('no_body');
            _('#spot-lat').innerHTML = spot.lat;
            _('#spot-lng').innerHTML = spot.lng;
            $.spot.lat = parseFloat(spot.lat);
            $.spot.lng = parseFloat(spot.lng);
            text = '';
            for (const image of data.images) {
                text += `<a href="//map.parkour.org/images/spots/${image.filename}" target="_blank" /><img src="//map.parkour.org/images/spots/thumbnails/320px/${image.filename}" /></a>`;
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