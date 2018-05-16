/* globals l, _, strip, t, ready, Http, Maps, Nav */
const Spot = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./http.js');
    // require('./map.js');
    // require('./nav.js');

    $.spot = {};

    ready.push(() => {
        Nav.events.spot_hide = () => _('#map').className = '';
        _('#spot-lat').title = t('label_lat');
        _('#spot-lng').title = t('label_lng');
    });

    $.loadSpot = id => {
        Http.get(`//map.parkour.org/api/v1/spot/${id}`, null, {Authorization: false}).then(data => {
            const spot = data.spot;
            $.spot = {id: id, type: spot.type, url_alias: spot.url_alias};

            _('#spot-title').innerText = spot.title || '';
            _('#spot').className = `spot-type-${spot.type}`;
            let type = t(`${spot.type}_type_${spot.category}`);
            if (data.spot_category_details && data.spot_category_details.length) {
                type += ` - ${data.spot_category_details.map(item => t(`spot_feature_${item}`)).join(', ')}`;
            }
            _('#spot-type').innerText = type;
            let text = '';
            const date = new Date(spot.created * 1000).toLocaleString();
            text += spot.user_created ? `${t('node_created_by', spot.user_created)} ${t('node_created_by_at', date)}` : `${t('node_created_at', date)}`;
            if (spot.changed > spot.created) {
                const date = new Date(spot.changed * 1000).toLocaleString();
                text += spot.user_changed ? `${t('node_changed_by', spot.user_changed)} ${t('node_changed_by_at', date)}` : `${t('node_changed_at', date)}`;
            }
            _('#spot-meta').innerText = text;
            _('#spot-body').innerHTML = spot.description || '';
            _('#spot-body').style.display = spot.description ? 'block' : 'none';
            _('#spot-lat').innerHTML = spot.lat;
            _('#spot-lng').innerHTML = spot.lng;
            $.spot.lat = parseFloat(spot.lat);
            $.spot.lng = parseFloat(spot.lng);
            text = '';
            for (const image of data.images) {
                text += `<a href="//map.parkour.org/images/spots/${image.filename}" target="_blank" /><img src="//map.parkour.org/images/spots/thumbnails/320px/${image.filename}" /></a>`;
            }
            _('#spot-images').innerHTML = text || '';
            _('#spot-images').style.display = text ? 'block' : 'none';

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
                if (window.mapLoaded) {
                    if (Nav.isLite) {
                        Maps.newMarker($.spot, true);
                    }
                    google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
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
                _('.add-here').forEach(item => item.style.display = 'none');
            }
        }, ignored => Nav.error(t('error_load_spot')));
    };

    _('#spot-map').onclick = () => {
        if (window.mapLoaded) {
            Nav.navigate('');
            Maps.map.setCenter($.spot);
            Maps.map.setZoom(15);
        }
    };

    _('#spot-web').onclick = () => location.href = `//map.parkour.org/${$.spot.type}/${$.spot.url_alias}`;

    _('#spot-edit').onclick = () => location.href = `//map.parkour.org/${$.spot.type}/${$.spot.url_alias}/edit`;
})(Spot);