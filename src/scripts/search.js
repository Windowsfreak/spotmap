/* globals _, t, strip, Http, Nav, Spot */
const Search = {}; ($ => {
    'use strict';
    // require('./base.js');
    // require('./http.js');
    // require('./nav.js');
    // require('./spot.js');
    const search = {};
    _('#search-submit').onclick = () => {
        const text = _('#search-text').value;
        Nav.navigate((/^(0|[1-9]\d*)$/.test(text) ? '#spot/' : '#search/') + text);
    };

    $.loadSearch = () => {
        const text = _('#search-text').value;
        if (/^(0|[1-9]\d*)$/.test(text)) {
            Nav.navigate('#spot/' + text);
        } else {
            search.data = {_format: 'hal_json', status: 'All', type: 'All', title: text, langcode: 'All', page: 0};
            Http.get('//www.parkour.org/rest/content/node?status=All&type=All&title=&langcode=All&page=0', search.data, {Authorization: false}).then($.showPage);
        }
    };

    $.showPage = result => {
        let text = '<div class="grid">';
        if (result.length === 0) {
            text += t('no_results_found');
        }
        for (const spot of result) {
            let nid;
            for (const s of Spot.find('nid|\\d+|value', spot)) {
                nid = s;
            }
            text += `<article onclick="Nav.navigate('#spot/${nid}');">`;

            for (const s of Spot.find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)) {
                text += `<div class="in-place cover" style="background-image: url(${s});"></div>`;
                if (s) {
                    break;
                }
            }

            text += '<div class="in-place title">';
            _('#spot-title').innerText = t('no_title');
            for (const s of Spot.find('title|\\d+|value', spot)) {
                text += `<h1><span>${strip(s)}</span></h1>`;
            }

            for (const s of Spot.find('body|\\d+|value', spot)) {
                text += `<p><span>${strip(s).substring(0, 100)}</span></p>`;
            }

            text += '</div>';
            text += '</article>';
        }
        text += '</div>';
        _('#search-page').innerHTML = text;
    };
})(Search);