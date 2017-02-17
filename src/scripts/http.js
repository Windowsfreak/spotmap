'use strict';
function b64a(text) {
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}
function getUser() {
    return localStorage.getItem('d8_user');
}
function getCredentials() {
    return localStorage.getItem('d8_auth') || 'Basic Og==';
}
function setCredentials(user, pass) {
    localStorage.setItem('d8_user', user);
    localStorage.setItem('d8_auth', 'Basic ' + b64a(user + ':' + pass));
}
function deleteCredentials() {
    localStorage.removeItem('d8_user');
    localStorage.removeItem('d8_auth');
}
function http(method, url, params, headers = {}) {
    if (headers.Authorization === false) {
        delete headers.Authorization;
    } else if (headers.user) {
        headers.Authorization = 'Basic ' + b64a(headers.user + ':' + headers.pass);
        delete headers.user;
        delete headers.pass;
    } else if (url.match(/^(https?:)?\/\/(www\.)parkour\.org\/?/)) {
        headers.Authorization = getCredentials();
    }
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch(e) {
                    error(t('error_server_request'));
                    resolve({method: method, url: url, params: params, headers: headers, status: this.status, statusText: xhr.statusText, message: xhr.response});
                }
            } else {
                xhr.onerror();
            }
        };
        xhr.onerror = function () {
            error(t('error_server_request'));
            const data = {method: method, url: url, params: params, headers: headers, status: this.status, statusText: xhr.statusText, message: xhr.response};
            reject(data);
        };
        if (headers) {
            Object.keys(headers).forEach(function (key) {
                xhr.setRequestHeader(key, headers[key]);
            });
        }
        // stringify params if object:
        if (params && typeof params === 'object') {
            xhr.send(Object.keys(params).map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&'));
        } else {
            xhr.send(params);
        }
    });
}
function get(url, params, headers) {
    if (params && typeof params === 'object') {
        return http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + Object.keys(params).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&'), undefined, headers);
    } else if (params) {
        return http('GET', url + (url.indexOf('?') > 0 ? '&' : '?') + params, undefined, headers);
    } else {
        return http('GET', url, params, headers);
    }
}
function post(url, params, headers) {
    return http('POST', url, params, headers);
}
function patch(url, params, headers) {
    return http('PATCH', url, params, headers);
}
function del(url, params, headers) {
    return http('REMOVE', url, params, headers);
}