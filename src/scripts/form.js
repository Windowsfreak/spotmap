/* globals _, t, html, ready, Http, Spot, Maps, Nav, script, grecaptcha */
const Form = {}; ($ => {
    'use strict';

    let captchaCode = false;

    // require('./base.js');
    // require('./http.js');
    // require('./map.js');
    // require('./nav.js');
    // require('./spot.js');

    const categories = {
        spot: [
            'outdoor',
            'gym',
            'parkourpark',
            'parkourgym',
            'climbinggym',
            'pool',
            'cliff'
        ],
        event: [
            'training',
            'workshop',
            'jam',
            'trip',
            'competition'
        ],
        group: [
            'private',
            'community',
            'club',
            'company'
        ],
        move: [
            'moves',
            'conditioning',
            'games',
            'jumps',
            'vaults',
            'bar',
            'flips',
            'combinations',
            'freezes',
            'beginner',
            'intermediate',
            'advanced'
        ]
    };

    window.captcha = () => {
        grecaptcha.render('form-captcha', {
            'sitekey' : '6LdRg1cUAAAAAFjzUokSQB6egcNS_o9EF_KAmW7i',
            'callback' : $.save
        });
    };

    ready.push(() => {
        Nav.events.form_show = () => {
            if (!captchaCode) {
                script('https://www.google.com/recaptcha/api.js?onload=captcha&render=explicit');
                captchaCode = true;
            }
            _('#map').style.display = 'block';
            _('#map').className = 'half';
            Maps.map.setCenter(Maps.marker.getPosition());
            google.maps.event.trigger(Maps.map, 'resize');
            google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                google.maps.event.trigger(Maps.map, 'resize');
                Maps.map.setCenter(Maps.marker.getPosition());
            });
            if (!Http.getUser()) {
                Nav.success(t('error_login_required'));
                Nav.navigate('#login');
            }
        };

        Nav.events.form_hide = isSame => {
            _('#map').className = '';
            if (localStorage.getItem('form_text') && !isSame) {
                Nav.success(t('draft_saved'));
            }
        };
    });

    $.add_here = type => {
        Maps.newMarker(Spot.spot, true);
        $.add(type);
    };

    $.add = type => {
        const formTypes = {
            spot: t('new_spot'),
            group: t('new_group'),
            event: t('new_event')
        };
        _('#form-type').innerText = formTypes[type];
        _('#form-category').innerHTML = `<option value="" disabled selected hidden>${t('form_category')}</option>` +
            categories[type].map(item => `<option value="${item}">${t(`${type}_type_${item}`)}</option>`).join('');
        _('#form-category').value = '';
        Spot.marker = {lat: Maps.marker.getPosition().lat(), lng: Maps.marker.getPosition().lng(), type: type};
        Nav.goTab('form');
    };

    $.backup = () => {
        localStorage.setItem('form_title', _('#form-title').value);
        localStorage.setItem('form_text', _('#form-text').value);
        if (Maps.marker) {
            localStorage.setItem('form_lat', Maps.marker.getPosition().lat());
            localStorage.setItem('form_lng', Maps.marker.getPosition().lng());
        }
        if (Spot.marker) {
            localStorage.setItem('form_type', Spot.marker.type);
        }
    };

    $.restore = () => {
        if (localStorage.getItem('form_text')) {
            _('#form-title').value = localStorage.getItem('form_title');
            _('#form-text').value = localStorage.getItem('form_text');
            Spot.marker = {
                lat: parseFloat(localStorage.getItem('form_lat')),
                lng: parseFloat(localStorage.getItem('form_lng')),
                type: localStorage.getItem('form_type')
            };
            window.panToPosition = false;
            Maps.newMarker(Spot.marker, true);
            Maps.map.panTo(Spot.marker);
            $.add(Spot.marker.type);
            google.maps.event.addListenerOnce(Maps.map, 'idle', () => {
                Maps.map.panTo(Maps.marker.getPosition());
            });
            Nav.success(t('draft_restored'));
        }
    };

    $.remove = silent => {
        if (silent || confirm(t('draft_delete_confirm'))) {
            localStorage.removeItem('form_title');
            localStorage.removeItem('form_text');
            localStorage.removeItem('form_lat');
            localStorage.removeItem('form_lng');
            localStorage.removeItem('form_type');
            _('#form-title').value = '';
            _('#form-text').value = '';
            Nav.goTab('map', 0);
            if (!silent) {
                Nav.success(t('draft_deleted'));
            }
        }
    };

    $.save = () => {
        const category = _('#form-category').value;
        if (!category) {
            Nav.error(t('form_category'));
            return;
        }
        const save = token => {
            Nav.success(t('in_progress'));
            const user = Http.getUser();
            Http.post('//map.parkour.org/api/v1/spot', JSON.stringify({
                type: Spot.marker.type,
                category: _('#form-category').value,
                title: _('#form-title').value,
                description: html(_('#form-text').value),
                lat: Spot.marker.lat,
                lng: Spot.marker.lng,
                user_created: user,
            }), {'Content-Type': 'application/json', 'X-CSRF-Token': token, 'X-Username': user}).then(data => {
                Nav.success(t('node_added'));
                Nav.navigate('#spot/' + data.id);
                $.remove(true);
            }, data => Nav.error(t((data.status === 403 || data.status === 401) ? 'error_forbidden' : 'error_add_node') + ' ' + data.message));
        };
        const token = grecaptcha.getResponse();
        if (!token) {
            grecaptcha.execute();
        } else {
            save(token);
            grecaptcha.reset();
        }
    };
})(Form);