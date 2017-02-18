const Maps = {}; (function($) {
    'use strict';

    require('./base.js');
    require('./form.js');
    require('./geotile.js');
    require('./nav.js');
    require('./proximity.js');
    require('./spot.js');
    const {_, t, ready, Form, Geotile, Nav, Proximity, Spot} = window;

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


    const initial = Date.now;
    $.panToPosition = !location.hash.startsWith('#map/');
    let gpsObj;
    $.icons = {};
    $.shapes = {};

    $.setGpsObj = function(position) {
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
            position: position
        });
    };

    $.updateGpsObj = function(position) {
        if (!gpsObj || gpsObj.position.coords.accuracy > position.coords.accuracy || gpsObj.position.timestamp < position.timestamp - 3000) {
            $.setGpsObj(position);
            return true;
        }
        return false;
    };

    $.pan = function(position) {
        $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
        $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        google.maps.event.addListenerOnce($.map, 'idle', function () {
            $.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
            $.map.setZoom(position.coords.accuracy < 200 ? 17 : position.coords.accuracy < 500 ? 16 : position.coords.accuracy < 2000 ? 15 : 13);
        });
    };

    $.afterTrack = function() {
        //_('button')[3].blur();
        //goTab('map', 0);
    };

    $.track = function(force) {
        if (force === 'yes') {
            window.panToPosition = true;
            Nav.goTab('map', 0);
        }
        navigator.geolocation.getCurrentPosition(function (position) {
            //$.marker.setPosition({lat: position.coords.latitude, lng: position.coords.longitude});
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!location.hash.startsWith('#map') && window.panToPosition)) {
                    $.pan(position);
                }
            }
        }, function () {
            // console.log('error1', arguments);
        }, {timeout: 250});

        navigator.geolocation.getCurrentPosition(function (position) {
            if ($.updateGpsObj(position) && (force || Date.now() < initial + 10000)) {
                if (force === 'yes' || (!location.hash.startsWith('#map') && window.panToPosition)) {
                    $.pan(position);
                }
            }
            $.afterTrack();
        }, function () {
            // console.log('error2', arguments);
            $.afterTrack();
        }, {enableHighAccuracy: true});
    };

    let markers = [];

    $.load = function(data) {
        const marker = new google.maps.Marker({
            id: data.id,
            map: $.map,
            title: '' + data.title,
            position: {lat: data.lat, lng: data.lng},
            data: data,
            icon: data.type.startsWith('multi') ? $.icons.zoom : (data.type.includes('group') ? $.icons.group : (data.type.includes('event') ? $.icons.event : $.icons.spot)),
            shape: data.type.startsWith('multi') ? $.shapes.zoom : $.shapes.spot
        });
        markers.push(marker);

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
            $.infoWindow.setContent(`<a onclick="navigate('#spot/${marker.data.id}');"><img class="type" src="${$.icons[marker.data.type].url}">${marker.data.title}</a>`);
            $.infoWindow.setPosition(marker.getPosition());
            $.infoWindow.open($.map);
            Proximity.getCloseNodes(marker.data.lat, marker.data.lng);
        }
    };

    $.loadAll = function(data) {
        for (const marker in markers) {
            markers[marker].setMap(null);
        }
        markers = [];
        for (const tile in data) {
            for (const entry in data[tile]) {
                $.load(data[tile][entry]);
            }
        }
    };

    $.initMapInternal = function() {
        const h = location.hash;
        const bounds = new google.maps.LatLngBounds({lat: 49, lng: 6}, {lat: 55, lng: 15});
        const mapOptions = {
            center: {lat: 51.5167, lng: 9.9167},
            zoom: 7
        };
        $.map = new google.maps.Map(_('#map'), mapOptions);

        if (h.startsWith('#map/')) {
            // console.log(h);
            const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            $.map.setCenter({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
            if (coords[4]) {
                $.map.setZoom(parseInt(coords[4]));
            }
        } else if (!window.panToPosition) {
            $.map.setZoom(15);
            if (typeof Spot.spot.lat !== 'undefined') {
                $.map.setCenter({lat: Spot.spot.lat, lng: Spot.spot.lng});
            }
        } else {
            $.map.fitBounds(bounds);
        }

        google.maps.event.addDomListener(window, 'resize', function () {
            const center = $.map.getCenter();
            google.maps.event.trigger($.map, 'resize');
            $.map.setCenter(center);
        });

        google.maps.event.addListener($.map, 'bounds_changed', function () {
            const bounds = $.map.getBounds();
            Geotile.loadBounds(bounds, $.loadAll);
            const center = $.map.getCenter();
            const coords = '#map/' + center.lat() + '/' + center.lng() + '/' + $.map.getZoom();
            if (location.hash !== coords && (location.hash.startsWith('#map/') || location.hash === '')) {
                history.replaceState({}, '', `#map/${center.lat().toFixed(5)}/${center.lng().toFixed(5)}/${$.map.getZoom()}`);
            }
        });

        google.maps.event.addListener($.map, 'click', $.newMarker);

        const filterDiv = document.createElement('div');
        const filter = new $.Filter(filterDiv, $.map);

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
        //get('./query3j.php', {latl:48.188063481211415,lath:55.51619215717891,lngl:-0.54931640625,lngh:20.54443359375,zoom:2}).then(loadAll);
        Form.restore();
    };

    $.newMarker = function(event, force) {
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

    $.dragMarker = function(event) {
        Nav.success(`${t('position')}: ${$.marker.getPosition().lat().toFixed(5)} ${$.marker.getPosition().lng().toFixed(5)}`);
    };

    $.endMarker = function(event) {
        $.map.panTo($.marker.getPosition());
        Form.backup();
    };

    $.clickMarker = function(event) {
        $.show($.marker);
    };

    $.Filter = function(filterDiv, map) {
        filterDiv.className = 'filterDiv';
        const controlUI = document.createElement('div');
        controlUI.className = 'filterBtn';
        controlUI.innerHTML = '&#9881;';
        filterDiv.appendChild(controlUI);
        const filterBox = document.createElement('div');
        filterBox.className = 'filterBox vanish';
        filterDiv.appendChild(filterBox);
        filterBox.innerHTML = `Zeige:<br /><span class="yes">${t('spot')}</span><br /><span class="no">${t('event')}</span><br /><span class="yes">${t('group')}</span>`;

        controlUI.addEventListener('click', function () {
            const elem = _('.filterBox')[0];
            elem.className = elem.className === 'filterBox' ? 'filterBox vanish' : 'filterBox';
            //map.setCenter(chicago);
        });
    };

})(Maps);