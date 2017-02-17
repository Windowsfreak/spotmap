'use strict';
function _(s){
    if(s[0]=='#') return document.getElementById(s.slice(1));
    else return document.querySelectorAll(s);
}

function strip(html)
{
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function t(template) {
    if (!lang[template]) console.log('MISSING: ' + template);
    return lang[template] ? lang[template].replace('\\1', arguments[1]) : 'MISSING: ' + template;
}

function setLang(target) {
    localStorage.setItem('lang', target);
    location.reload();
}

for (const item of _('*')) {
    if (item.dataset.translate) {
        if (['input', 'textarea'].indexOf(item.tagName.toLowerCase()) >= 0) {
            item.placeholder = t(item.dataset.translate);
        } else {
            item.innerHTML = t(item.dataset.translate);
        }
    }
}