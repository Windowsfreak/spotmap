'use strict';
window.nav = (window.nav === undefined) ? {} : window.nav;
let isLite = false;

function openTab(id, evt, parent = _('#' + id).parentNode) {
    const sections = _('section');
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].parentNode === parent) {
            if (sections[i].style.display === 'block') {
                console.log('Hiding  ' + sections[i].id);
                if (nav[sections[i].id + '_hide']) {
                    nav[sections[i].id + '_hide'](id == sections[i].id);
                }
            }
            sections[i].style.display = 'none';
        }
    }

    if (evt) {
        const buttons = _('button');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].className = buttons[i].className.replace(' active', '');
        }
        evt.currentTarget.className += ' active';
    }

    _('#' + id).style.display = 'block';
    console.log('Showing ' + id);
    if (nav[id + '_show']) {
        nav[id + '_show']();
    }
}
function goTab(id, index) {
    openTab(id, index !== undefined ? {currentTarget:_('button')[index]} : undefined);
}
function resetTab() {
    navigate('');
    // goTab('map', 0);
}
// document.addEventListener('DOMContentLoaded', resetTab);

function notice(text, type) {
    if (window.noticeHideTimeout) {
        noticeHide();
    }
    _('#notice').className = type + ' show';
    _('#notice-text').innerText = text;
    window.noticeHideTimeout = window.setTimeout(noticeHide, 4000);
}
function error(text) {
    notice(text, 'error');
}
function success(text) {
    notice(text, 'success');
}
function noticeHide(fast = false) {
    _('#notice').className += fast ? ' vanish' : ' hide';
    if (window.noticeHideTimeout) {
        window.clearTimeout(window.noticeHideTimeout);
        delete window.noticeHideTimeout;
    }
}
goTab('map', 0);

window.onhashchange = navigate;

function navigate(h) {
    if (typeof h === 'string') {
        location.hash = h;
        return;
    }
    h = location.hash;
    if (h.startsWith('#event/') || h.startsWith('#group/') || h.startsWith('#move/') || h.startsWith('#page/') || h.startsWith('#post/') || h.startsWith('#spot/')) {
        const match = /#(\w+)\/(\d+)(?:\/(.*))?/g.exec(h);
        if (match[3] == 'lite') {
            _('body')[0].className = 'lite';
            isLite = true;
        }
        loadSpot(match[2]);
    } else if (h.startsWith('#login')) {
        goTab('login', 2);
    } else if (h.startsWith('#search')) {
        goTab('search', 1);
        if (h.startsWith('#search/')) {
            _('#search-text').value = /#(\w+)\/(.*)/g.exec(h)[2];
            loadSearch();
        }
    } else if (h == '' || h.startsWith('#map/')) {
        goTab('map', 0);
        if (h.startsWith('#map/')) {
            const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
            // console.log([coords[2], coords[3], coords[4]]);
            if (map) {
                map.panTo({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
                if (coords[4]) map.setZoom(parseInt(coords[4]));
            }
        }
    }
}

_('body')[0].onkeyup = function(e){
    if(e.which == 27){
        goTab('map', 0);
    }
};