const Login = {}; ($ => {
    'use strict';
    require('./base.js');
    require('./http.js');
    require('./nav.js');
    const {_, t, ready, Http, Nav} = window;

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
        let pass = _('#login-password');
        Http.setCredentials(user.value, pass.value);
        //get('//www.parkour.org/user/1',{_format: 'hal_json'}).then(function() {
        Nav.success(t('logged_in_as', user.value));
        user.value = '';
        pass.value = '';
        Nav.events.login_show();
        /*}, function() {
         error(t('error_login'));
         deleteCredentials();
         pass.value = '';
         pass.focus();
         });*/
    };

    _('#logout-submit').onclick = () => {
        Http.deleteCredentials();
        Nav.events.login_show();
    };
})(Login);