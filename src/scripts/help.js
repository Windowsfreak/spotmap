/* globals l, _, strip, t, ready, Http, Nav, Spot */
const Help = {}; ($ => {
    'use strict';

    // require('./base.js');
    // require('./http.js');
    // require('./nav.js');
    // require('./spot.js');

    ready.push(() => Nav.events.help_show = (previous) => $.previous = previous !== 'help' ? previous : $.previous);

    $.show = id =>
        Http.get(`./static/${id}_${l}.json`, undefined, {Authorization: false}).then(data => {
            _('#help-title').innerText = data.title || t('no_title');
            _('#help-body').innerHTML = data.body || strip(t('no_body'));
            Nav.goTab('help');
        }, ignored => Nav.error(t('no_results_found')));

    $.close = () => Help.previous ? Nav.goTab(Help.previous) : Nav.resetTab();
})(Help);