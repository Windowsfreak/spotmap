/* globals _, t, ready, Http, Nav */
const Login = {}; ($ => {
    'use strict';
    // require('./base.js');
    // require('./http.js');
    // require('./nav.js');

    ready.push(() => {
        Nav.events.login_show = () => {
            if (Http.getUser() !== null) {
                Nav.goTab('logout-form');
                _('#username').innerText = Http.getUser();
            } else {
                Nav.goTab('login-form');
            }
        };
    });

    _('#login-submit').onclick = () => {
        let user = _('#login-username');
        Http.setCredentials(user.value);
        Nav.success(t('logged_in_as', user.value));
        user.value = '';
        Nav.events.login_show();
    };

    _('#logout-submit').onclick = () => {
        Http.deleteCredentials();
        Nav.events.login_show();
    };
})(Login);