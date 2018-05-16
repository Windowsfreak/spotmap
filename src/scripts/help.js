/* globals l, _, strip, t, ready, Http, Nav, Spot */
const Help = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./http.js');
    // require('./nav.js');
    // require('./spot.js');

    ready.push(() => Nav.events.help_show = (previous) => $.previous = previous !== 'help' ? previous : $.previous);

    $.display = data => {
        _('#help-title').innerText = data.title || '';
        _('#help-body').innerHTML = data.body || '';
        Nav.goTab('help');
    };

    $.show = id =>
        Http.get(`./static/${id}_${l}.json`, undefined, {Authorization: false}).then($.display, ignored => Nav.error(t('no_results_found')));

    $.close = () => Help.previous ? Nav.goTab(Help.previous) : Nav.resetTab();
})(Help);