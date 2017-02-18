const exec = require('child_process').exec;
function result(error, stdout, stderr) {
    if (error) console.log('error', error);
    if (stdout) console.log('stdout', stdout);
    if (stderr) console.log('stderr', stderr);
}
rmrf = require('rimraf');
rmrf.sync('inc/smoothie');
exec('git clone https://github.com/letorbi/smoothie.git -b master inc/smoothie', result);