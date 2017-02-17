/*
 * Parkour.org Spotmap
 * https://github.com/windowsfreak/spotmap
 *
 * Copyright (c) 2017 Björn Eberhardt
 * Licensed under the MIT license.
 */
const spotmap = require('./src/scripts/base.js');
const stdin = process.openStdin();
const instance = new merchant.Merchant();
stdin.addListener('data', function (d) {
    // note: d is an object, and when converted to a string it will
    // end with a linefeed. so we (rather crudely) account for that
    // with toString() and then trim()
    try {
        const response = d.toString().trim();
        if (response !== undefined) {
            console.log(response);
        }
    } catch (e) {
        console.log(`Error: ${e}`);
    }
});