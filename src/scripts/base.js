// global
/* globals lang */
($ => {
    'use strict';
    // require('./lang_en.js');
    $.ready = [];
    $.runLater = () => ($.ready = $.ready.map(item => (typeof item === 'function') && item()).filter(item => item)).length && $.runLater();
    $._ = s => s[0] === '#' ? document.getElementById(s.slice(1)) : document.querySelectorAll(s);
    $.dom = t => document.createElement(t);

    $.strip = html => {
        const tmp = $.dom('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    $.html = text => {
        const tmp = $.dom('DIV');
        tmp.innerText = text;
        return tmp.innerHTML || '';
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
            if (item.getAttribute('data-translate')) {
                item[['input', 'textarea', 'select'].indexOf(item.tagName.toLowerCase()) >= 0 ? 'placeholder' : 'innerHTML'] = $.t(item.getAttribute('data-translate'));
            }
        }
    };

    $.script = (url, callback) => {
        const s = $.dom('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = url;
        const p = $._('head')[0];
        if (callback) { s.addEventListener('load', callback, false); }
        p.appendChild(s);
    };

    $.t_html();
})(window);