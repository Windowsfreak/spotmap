/* globals lang, ready, script */
const Testing = {}; ($ => {
    'use strict';

    const langList = ['de', 'en', 'fr', 'it', 'nl', 'da'];

    $.langs = {};

    ready.push(() => {
        $.runNext();
    });

    $.runNext = function() {
        let nextLang = false;
        langList.forEach(item => {
            if (!$.langs[item]) {
                nextLang = item;
            }
        });
        if (nextLang) {
            script(`scripts/lang_${nextLang}.js`, () => {
                $.langs[nextLang] = lang;
                $.runNext();
            });
        } else {
            $.checkLangs();
        }
    };

    $.checkLangs = function() {
        const keys = Object.assign({}, ...Object.values($.langs));
        Object.entries(keys).forEach(([key, val]) => {
            Object.entries($.langs).forEach(([l_key, l_val]) => {
                if (!l_val[key]) {
                    console.log(`Missing ${l_key} translation for key ${key} (example: "${val}")`);
                }
            });
        });
    };
})(Testing);