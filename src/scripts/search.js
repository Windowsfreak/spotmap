'use strict';
const search = {};
_('#search-submit').onclick = function() {
    const text = _('#search-text').value;
    if (/^(0|[1-9]\d*)$/.test(text)) {
        navigate('#spot/' + text);
        //loadSpot(text);
    } else {
        navigate('#search/' + text);
    }
};

function loadSearch() {
    const text = _('#search-text').value;
    if (/^(0|[1-9]\d*)$/.test(text)) {
        navigate('#spot/' + text);
        //loadSpot(text);
    } else {
        search.data = {_format: 'hal_json', status: 'All', type: 'All', title: text, langcode: 'All', page: 0};
        get('//www.parkour.org/rest/content/node?status=All&type=All&title=&langcode=All&page=0', search.data, {Authorization: false}).then(showPage);
    }
}

function showPage(result) {
    let text2 = '<div class="grid">';
    let text = '';
    for (const spot of result) {
        let nid;
        for (const s of find('nid|\\d+|value', spot)) nid = s;
        text += `<article onclick="navigate('#spot/${nid}');">`;
        text2 += `<article onclick="navigate('#spot/${nid}');">`;

        for (const s of find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)) {
            text2 += `<div class="in-place cover" style="background-image: url(${s});"></div>`;
            if (s) break;
        }

        text2 += '<div class="in-place title">';
        _('#spot-title').innerText = t('no_title');
        for (const s of find('title|\\d+|value', spot)) {
            text += `<h1>${strip(s)}</h1>`;
            text2 += `<h1><span>${strip(s)}</span></h1>`;
        }

        for (const s of find('body|\\d+|value', spot)) {
            text += `<p>${strip(s).substring(0, 100)}</p>`;
            text2 += `<p><span>${strip(s).substring(0, 100)}</span></p>`;
        }

        for (const s of find('_links|.+parkour\.org\/rest\/relation\/node\/.+\/field_images|\\d+|href', spot)) {
            text += `<img class="spot" src="${s}" />`;
            if (s) break;
        }
        text2 += '</div>';
        text += '</article>';
        text2 += '</article>';
    }
    text2 += '</div>';
    _('#search-page').innerHTML = text2;
}