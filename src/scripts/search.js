/* globals _, t, strip, Http, Maps, Nav, Spot */
const Search = {}; ($ => {
    'use strict';
    // require('./base.js');
    // require('./http.js');
    // require('./maps.js');
    // require('./nav.js');
    // require('./spot.js');
    const search = {};
    _('#search-submit').onclick = () => {
        const text = _('#search-text').value;
        Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + text);
    };
    _('#search-geocode').onclick = () => {
        const text = _('#search-text').value;
        Maps.geocode(text);
        Nav.navigate('');
    };

    $.loadSearch = () => {
        const text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = {search: text, limit: 25};
            Http.get('//map.parkour.org/api/v1/spots/search', search.data, {Authorization: false}).then($.showPage);
        }
    };

    $.showPage = result => {
        let text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        for (const spot of result) {
            text += `<article onclick="Nav.navigate('#spot/${spot.id}');">`;
            if (spot.p0) {
              text += `<div class="in-place cover" style="background-image: url(//map.parkour.org/images/spots/thumbnails/320px/${spot.p0});"></div>`;
            }

            text += '<div class="in-place title">';
            text += `<h1><span>${strip(spot.title)}</span></h1>`;
            text += `<p><span>${strip(spot.description).substring(0, 100)}</span></p>`;

            text += '</div>';
            text += '</article>';
        }
        text += '</div>';
        _('#search-page').innerHTML = text;
    };
})(Search);