'use strict';
window.nav = (window.nav === undefined) ? {} : window.nav;

nav.login_show = function() {
    if (getUser() !== null) {
        goTab('logout-form');
        _('#username').innerText = getUser();
    } else {
        goTab('login-form');
    }
};

_('#login-submit').onclick = function() {
    let user = _('#login-username');
    let pass = _('#login-password');
    setCredentials(user.value, pass.value);
    //get('//www.parkour.org/user/1',{_format: 'hal_json'}).then(function() {
        success(t('logged_in_as', user.value));
        user.value = '';
        pass.value = '';
        nav.login_show();
    /*}, function() {
        error(t('error_login'));
        deleteCredentials();
        pass.value = '';
        pass.focus();
    });*/
};

_('#logout-submit').onclick = function() {
    deleteCredentials();
    nav.login_show();
};