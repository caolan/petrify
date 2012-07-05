#!/usr/bin/env node

var utils = require('../lib/utils'),
    logger = require('../lib/logger'),
    commands = require('../lib/commands');


var args = process.argv.slice(2);

for (var i = 0; i < args.length; i += 1) {
    if (args[i] === '--debug') {
        args.splice(i, 1);
        logger.level = 'debug';
    }
}


// This object is created by .*rc files in other cli projects,
// until we need the extra configuration options I'm just using
// an empty object

var settings = {};


function usage() {
    console.log('Usage: tea COMMAND [ARGS]');
    console.log('');
    console.log('Available commands:');
    var len = utils.longest(Object.keys(commands));
    for (var k in commands) {
        if (!commands[k].hidden) {
            console.log(
                '  ' + utils.padRight(k, len) + '    ' + commands[k].summary
            );
        }
    }
    logger.clean_exit = true;
}

if (!args.length) {
    usage();
}
else {
    var cmd = args.shift();
    if (cmd === '-h' || cmd === '--help') {
        usage();
    }
    else if (cmd === '-v' || cmd === '--version') {
        utils.getTeaVersion(function (err, ver) {
            if (err) {
                return logger.error(err);
            }
            logger.clean_exit = true;
            console.log(ver);
        });
    }
    else if (cmd in commands) {
        commands[cmd].run(settings, args, commands);
    }
    else {
        logger.error('No such command: ' + cmd);
        usage();
    }
}
