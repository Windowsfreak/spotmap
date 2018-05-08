/* globals _, t, dom, ready, Form, Geotile, Nav, Proximity, Spot */
const Maps = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./form.js');
    // require('./geotile.js');
    // require('./nav.js');
    // require('./proximity.js');
    // require('./spot.js');

    ready.push(() => {
        Nav.events.map_show = () => {
            if (window.google) {
                const pos = $.map.getCenter();
                google.maps.event.trigger($.map, 'resize');
                $.map.setCenter(pos);
            }
        };

        window.mapScripts = true;
        if (window.mapLoaded) {
            $.initMapInternal();
        }
    });

    $.mapped = hash => hash.startsWith('#map/') || hash.startsWith('#spot/');

    const initial = Date.now;
    window.panToPosition = !$.mapped(location.hash);
    $.filter = ['spot', 'event', 'group'];
    let gpsObj;
    $.icons = {};
    $.shapes = {};

    $.setGpsObj = position => {
        if (gpsObj) {
            gpsObj.setMap(null);
        }
        gpsObj = new google.maps.Circle({
            strokeColor: '#0000FF',
            strokeOpacity: 0.4,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.1,
            map: $.map,
            center: {lat: position.coords.latitude, lng: position.coords.longitude},
            radius: position.coords.accuracy,
            position: position,
            clickable: false
        });
    };

    $.updateGpsObj = position => {
        if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
            $.setGpsObj(position);
            return true;
        }
        return false;
    };

    $.pan = position => {
        const pan = () => {
            $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
            $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        };
        pan();
        google.maps.event.addListenerOnce($.map, 'idle', pan);
    };

    $.track = force => {
        if (force === 'yes') {
            window.panToPosition = true;
            Nav.goTab('map', 0);
        }
        const checkPan = position => {
            console.log(position);
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!$.mapped(location.hash) || window.panToPosition)) {
                    $.pan(position);
                }
            }
        };
        try {
            navigator.geolocation.getCurrentPosition(checkPan, () => false, {timeout: 250});

            navigator.geolocation.getCurrentPosition(checkPan, () => false, {enableHighAccuracy: true});
        } catch (ignored) {
            Nav.error('The browser is too old, Geolocation is not supported.'); // TODO translate
        }
    };

    $.markers = {};

    $.load = (data, list) => {
        const multi = data.type.startsWith('multi');
        const marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: multi ? (`${data.title} ${t('btn_spots')}
${data.category.replace(/^multi,/, '').replace(/,/g, ', ')}`) : data.title,
            position: {lat: data.lat, lng: data.lng},
            data: data,
            icon: multi ? $.icons.zoom : (data.type.includes('group') ? $.icons.group : (data.type.includes('event') ? $.icons.event : $.icons.spot)),
            shape: multi ? $.shapes.zoom : $.shapes.spot
        });
        list.push(marker);

        google.maps.event.addListener(marker, 'click', $.show);
    };

    $.show = function(marker) {
        if (!marker || marker.latLng || marker.pixel) {
            marker = this;
        }
        if (marker.data.category === 'add') {
            if (Nav.isLite) {
                return;
            }
            $.map.panTo(marker.getPosition());
            $.infoWindow.setContent(`
            <button type="button" onclick="Form.add('spot')">&#x2795; ${t('spot')}</button>
            <button type="button" onclick="Form.add('event')">&#x2795; ${t('event')}</button>
            <button type="button" onclick="Form.add('group')">&#x2795; ${t('group')}</button>`);
            $.infoWindow.open($.map, marker);
        } else if (marker.data.category.startsWith('multi')) {
            $.infoWindow.close();
            $.map.panTo(marker.getPosition());
            $.map.setZoom($.map.getZoom() + 2);
        } else {
            const icon = marker.data.type.startsWith('multi') ? $.icons.zoom : (marker.data.type.includes('group') ? $.icons.group : (marker.data.type.includes('event') ? $.icons.event : $.icons.spot));
            $.infoWindow.setContent(`<a onclick="Nav.navigate('#spot/${marker.data.id}');"><img class="type" src="${icon.url}">${marker.data.title}</a>`);
            $.infoWindow.setPosition(marker.getPosition());
            $.infoWindow.open($.map);
            Proximity.getCloseNodes(marker.data.lat, marker.data.lng);
        }
    };

    $.loadAll = data => {
        for (const tile in data) {
            if (!$.markers[tile] || (data[tile] && $.markers[tile].length !== data[tile].length)) {
                const newTile = [];
                for (const entry in data[tile]) {
                    if ($.matchesFilter(data[tile][entry])) {
                        $.load(data[tile][entry], newTile);
                    }
                }
                if ($.markers[tile]) {
                    for (const marker in $.markers[tile]) {
                        $.markers[tile][marker].setMap(null);
                    }
                }
                $.markers[tile] = newTile;
            }
        }
        for (const tile in $.markers) {
            if (!data[tile]) {
                for (const marker in $.markers[tile]) {
                    $.markers[tile][marker].setMap(null);
                }
                delete $.markers[tile];
            }
        }
    };

    $.handleBoundsChanged = () => {
        const bounds = $.map.getBounds();
        Geotile.loadBounds(bounds, $.loadAll);
        const center = $.map.getCenter();
        const coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
        if (location.hash !== coords && (location.hash.startsWith('#map/') || location.hash === '')) {
            history.replaceState({}, '', `#map/${center.lat().toFixed(5)}/${center.lng().toFixed(5)}/${$.map.getZoom()}`);
        }
    };

    $.initMapInternal = () => {
        const h = location.hash;
        const bounds = new google.maps.LatLngBounds({lat: 49, lng: 6}, {lat: 55, lng: 15});
        const mapOptions = {
            center: {lat: 51.5167, lng: 9.9167},
            zoom: 7
        };
        $.map = new google.maps.Map(_('#map'), mapOptions);

        $.geocoder = new google.maps.Geocoder();

        if (h.startsWith('#map/')) {
            // console.log(h);
            const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            $.map.setCenter({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
            if (coords[4]) {
                $.map.setZoom(parseInt(coords[4], 10));
            }
        } else if (!window.panToPosition) {
            $.map.setZoom(15);
            if (typeof Spot.spot.lat !== 'undefined') {
                $.map.setCenter(Spot.spot);
            }
        } else {
            $.map.fitBounds(bounds);
        }

        google.maps.event.addDomListener(window, 'resize', () => {
            const center = $.map.getCenter();
            google.maps.event.trigger($.map, 'resize');
            $.map.setCenter(center);
        });

        google.maps.event.addListener($.map, 'bounds_changed', $.handleBoundsChanged);

        google.maps.event.addListener($.map, 'click', $.newMarker);

        const filterDiv = dom('div');
        $.createFilter(filterDiv);

        filterDiv.index = 1;
        $.map.controls[google.maps.ControlPosition.LEFT_TOP].push(filterDiv);

        $.icons.event = {
            url: 'images/green.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.icons.group = {
            url: 'images/purple.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.icons.spot = {
            url: 'images/logo32.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 31)
        };
        $.shapes.spot = {
            coords: [15, 0, 31, 7, 15, 31, 0, 7, 15, 0],
            type: 'poly'
        };
        $.icons.zoom = {
            url: 'images/multi.png',
            size: new google.maps.Size(24, 24),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(8, 8)
        };
        $.shapes.zoom = {
            coords: [11, 0, 14, 1, 16, 3, 18, 5, 18, 13, 18, 15, 24, 20, 24, 23, 15, 19, 7, 18, 1, 15, 0, 7, 3, 2, 7, 0, 11, 0],
            type: 'poly'
        };
        $.icons.crosshair = {
            url: 'images/crosshair.png',
            size: new google.maps.Size(49, 49),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(24, 24)
        };

        $.infoWindow = new google.maps.InfoWindow({
            content: 'Some address here..',
            maxWidth: 500,
            pixelOffset: new google.maps.Size(0, -31)
        });

        $.track(true);
        Form.restore();
    };

    $.geocode = address => {
        $.geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                $.newMarker({latLng: results[0].geometry.location}, true);
                $.map.setCenter(results[0].geometry.location);
                $.map.setZoom(15);
            } else {
                Nav.error(`${t('error_geocode')} ${status}`);
            }
        });
    };

    $.newMarker = (event, force) => {
        if (!event.latLng) {
            event.latLng = {lat: event.lat, lng: event.lng};
        }
        if (!force && Nav.isLite) {
            return;
        }
        if (!force && $.map.getZoom() < 14) {
            Nav.success(t('zoom'));
            return;
        }
        if ($.marker) {
            $.marker.setPosition(event.latLng);
        } else {
            $.marker = new google.maps.Marker({
                position: event.latLng,
                map: $.map,
                title: t('new_marker'),
                icon: $.icons.crosshair,
                draggable: !Nav.isLite,
                data: {category: 'add'}
            });
            $.marker.addListener('drag', $.dragMarker);
            $.marker.addListener('dragend', $.endMarker);
            $.marker.addListener('click', $.show);
            $.show($.marker);
        }
        $.dragMarker();
        Form.backup();
    };

    $.dragMarker = event => Nav.success(`${t('position')}: ${$.marker.getPosition().lat().toFixed(5)} ${$.marker.getPosition().lng().toFixed(5)}`);

    $.endMarker = event => {
        $.map.panTo($.marker.getPosition());
        Form.backup();
    };

    $.clickMarker = event => $.show($.marker);

    $.createFilter = filterDiv => {
        filterDiv.className = 'filterDiv';
        const controlUI = dom('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        const filterBox = dom('div');
        filterBox.className = 'filterBox vanish';
        filterDiv.appendChild(filterBox);
        filterBox.innerHTML = `Zeige:<br />
            <span class="yes" id="filter-spot" onclick="Maps.toggleFilter('spot')">${t('spot')}</span><br />
            <span class="yes" id="filter-event" onclick="Maps.toggleFilter('event')">${t('event')}</span><br />
            <span class="yes" id="filter-group" onclick="Maps.toggleFilter('group')">${t('group')}</span>`;
        controlUI.addEventListener('click', () => {
            const elem = _('.filterBox')[0];
            elem.className = elem.className === 'filterBox' ? 'filterBox vanish' : 'filterBox';
        });
    };

    $.toggleFilter = filterType => {
        const elem = _(`#filter-${filterType}`);
        elem.className = (elem.className === 'yes') ? 'no' : 'yes';
        if (elem.className === 'yes') {
            if (!$.filter.includes(filterType)) {
                $.filter.push(filterType);
            }
        } else {
            const i = $.filter.indexOf(filterType);
            if(i !== -1) {
                $.filter.splice(i, 1);
            }
        }
        $.loadAll([]);
        $.handleBoundsChanged();
    };

    $.matchesFilter = entry => {
        for (const f of $.filter) {
            if (entry.type.indexOf(f) !== -1) {
                return true;
            }
        }
        return false;
    };

})(Maps);