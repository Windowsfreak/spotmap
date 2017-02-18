const Http = {}; (function($) {
    'use strict';

    require('./geohash.js');
    require('./nav.js');
    const {t, Nav} = window;

    $.b64a = text => btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));

    $.getUser = () => localStorage.getItem('d8_user');

    $.getCredentials = () => localStorage.getItem('d8_auth') || 'Basic Og==';

    $.setCredentials = (user, pass) => {
        localStorage.setItem('d8_user', user);
        localStorage.setItem('d8_auth', 'Basic ' + $.b64a(user + ':' + pass));
    };

    $.deleteCredentials = () => {
        localStorage.removeItem('d8_user');
        localStorage.removeItem('d8_auth');
    };

    $.http = function(method, url, params, headers = {}) {
        if (headers.Authorization === false) {
            delete headers.Authorization;
        } else if (headers.user) {
            headers.Authorization = 'Basic ' + $.b64a(headers.user + ':' + headers.pass);
            delete headers.user;
            delete headers.pass;
        } else if (url.match(/^(https?:)?\/\/(www\.)parkour\.org\/?/)) {
            headers.Authorization = $.getCredentials();
        }
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.response));
                    } catch (e) {
                        Nav.error(t('error_server_request'));
                        resolve({
                            method: method,
                            url: url,
                            params: params,
                            headers: headers,
                            status: this.status,
                            statusText: xhr.statusText,
                            message: xhr.response
                        });
                    }
                } else {
                    xhr.onerror();
                }
            };
            xhr.onerror = () => {
                Nav.error(t('error_server_request'));
                const data = {
                    method: method,
                    url: url,
                    params: params,
                    headers: headers,
                    status: this.status,
                    statusText: xhr.statusText,
                    message: xhr.response
                };
                reject(data);
            };
            if (headers) {
                Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
            }
            // stringify params if object:
            if (params && typeof params === 'object') {
                xhr.send(Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&'));
            } else {
                xhr.send(params);
            }
        });
    };

    $.get = (url, params, headers) => {
        if (params && typeof params === 'object') {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + Object.keys(params).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&'), undefined, headers);
        } else if (params) {
            return $.http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + params, undefined, headers);
        } else {
            return $.http('GET', url, params, headers);
        }
    };
    $.post = (url, params, headers) => $.http('POST', url, params, headers);
    $.patch = (url, params, headers) => $.http('PATCH', url, params, headers);
    $.del = (url, params, headers) => $.http('REMOVE', url, params, headers);
})(Http);