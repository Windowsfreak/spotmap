// global
/* globals lang */
($ => {
    'use strict';
    // require('./lang_en.js');
    $.ready = [];
    $.runLater = () => ($.ready = $.ready.map(item => (typeof item === 'function') && item()).filter(item => item)).length && $.runLater();
    $._ = s => s[0] === '#' ? document.getElementById(s.slice(1)) : document.querySelectorAll(s);

    $.strip = html => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.t = (template, field) => {
        if (!lang[template]) {
            console.log(`MISSING: ${template}`);
        }
        return lang[template] ? lang[template].replace('\\1', field) : `MISSING: ${template}`;
    };

    $.setLang = target => {
        localStorage.setItem('lang', target);
        location.reload();
    };

    $.t_html = () => {
        for (const item of $._('*')) {
            if (item.dataset.translate) {
                item[['input', 'textarea'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.dataset.translate);
            }
        }
    };

    $.t_html();
})(window);