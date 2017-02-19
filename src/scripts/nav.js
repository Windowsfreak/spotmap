/* globals _, t, ready, Spot, Search */
const Nav = {}; ($ => {
    'use strict';
    // require('./base.js');
    // require('./spot.js');
    // require('./search.js');
    $.events = {};
    $.isLite = false;

    $.openTab = (id, evt, parent = _('#' + id).parentNode) => {
        const sections = _('section');
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].parentNode === parent) {
                if (sections[i].style.display === 'block') {
                    console.log('Hiding  ' + sections[i].id);
                    if ($.events[sections[i].id + '_hide']) {
                        $.events[sections[i].id + '_hide'](id === sections[i].id);
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
        if ($.events[id + '_show']) {
            $.events[id + '_show']();
        }
    };

    $.goTab = (id, index) => $.openTab(id, index !== undefined ? {currentTarget: _('button')[index]} : undefined);
    $.resetTab = () => $.navigate('');

    $.notice = (text, type) => {
        if (window.noticeHideTimeout) {
            $.noticeHide();
        }
        _('#notice').className = type + ' show';
        _('#notice-text').innerText = text;
        window.noticeHideTimeout = window.setTimeout($.noticeHide, 4000);
    };
    $.error = text => $.notice(text, 'error');
    $.success = text => $.notice(text, 'success');

    $.noticeHide = fast => {
        _('#notice').className += fast ? ' vanish' : ' hide';
        if (window.noticeHideTimeout) {
            window.clearTimeout(window.noticeHideTimeout);
            delete window.noticeHideTimeout;
        }
    };

    $.navigate = h => {
        if (typeof h === 'string') {
            location.hash = h;
            return;
        }
        h = location.hash;
        if (h.startsWith('#event/') || h.startsWith('#group/') || h.startsWith('#move/') || h.startsWith('#page/') || h.startsWith('#post/') || h.startsWith('#spot/')) {
            const match = /#(\w+)\/(\d+)(?:\/(.*))?/g.exec(h);
            if (match[3] === 'lite') {
                _('body')[0].className = 'lite';
                $.isLite = true;
            }
            Spot.loadSpot(match[2]);
        } else if (h.startsWith('#login')) {
            $.goTab('login', 2);
        } else if (h.startsWith('#search')) {
            $.goTab('search', 1);
            if (h.startsWith('#search/')) {
                _('#search-text').value = /#(\w+)\/(.*)/g.exec(h)[2];
                Search.loadSearch();
            }
        } else if (h === '' || h.startsWith('#map/')) {
            $.goTab('map', 0);
            if (h.startsWith('#map/')) {
                const coords = /#(\w+)\/([^/]*)\/([^/]*)(?:\/([^/]*))?/g.exec(h);
                // console.log([coords[2], coords[3], coords[4]]);
                if (Map.map) {
                    Map.map.panTo({lat: parseFloat(coords[2]), lng: parseFloat(coords[3])});
                    if (coords[4]) {
                        Map.map.setZoom(parseInt(coords[4], 10));
                    }
                }
            }
        }
    };

    $.goTab('map', 0);
    _('body')[0].onkeyup = e => (e.which !== 27) || $.goTab('map', 0);
    ready.push(() => () => {
        document.addEventListener('DOMContentLoaded', $.navigate, false);
        window.onhashchange = $.navigate;
    });

})(Nav);