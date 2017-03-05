/* globals l, _, strip, t, ready, Http, Nav, Spot */
const Help = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./http.js');
    // require('./nav.js');
    // require('./spot.js');

    ready.push(() => Nav.events.help_show = (previous) => $.previous = previous !== 'help' ? previous : $.previous);

    $.show = id => {
        Http.get(`./static/${id}_${l}.json`, undefined, {Authorization: false}).then(data => {
            _('#help-title').innerText = t('no_title');
            for (const s of Spot.find('title', data)) {
                _('#help-title').innerText = s;
            }

            _('#help-body').innerText = t('no_body');
            for (const s of Spot.find('body', data)) {
                _('#help-body').innerHTML = s;
            }

            Nav.goTab('help');
        }, data => Nav.error(t('no_results_found')));
    };
})(Help);