var async = require('async'),
    Handlebars = require('handlebars'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils');


function filenameFilter(p) {
    return function (f) {
        var relpath = path.relative(p, f);
        // should not start with a '.'
        if (/^\./.test(relpath)) {
            return false;
        }
        // should not contain a file or folder starting with a '.'
        if (/\/\./.test(relpath)) {
            return false;
        }
        return true;
    };
}


module.exports = function (tea, context, config, callback) {
    context.handlebars = {};

    var p = config.path;
    if (!p) {
        return callback('No path specified');
    }

    var _isFunction = function(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    };

    Handlebars.registerHelper('uc', function (str) {
        return encodeURIComponent(str);
    });

    var head = function (arr, fn) {
        if (_isFunction(fn)) {
            // block helper
            return fn(arr[0]);
        }
        else {
            return arr[0];
        }
    };

    Handlebars.registerHelper('first', head);
    Handlebars.registerHelper('head', head);

    Handlebars.registerHelper('tail', function (arr, fn) {
        if (_isFunction(fn)) {
            // block helper
            var out = '';
            for (var i = 1, len = arr.length; i < len; i++) {
                out += fn(arr[i]);
            }
            return out;
        }
        else {
            return arr.slice(1);
        }
    });

    Handlebars.registerHelper('ifequal', function (val1, val2, fn, elseFn) {
        if (val1 === val2) {
            return fn();
        }
        else if (elseFn) {
            return elseFn();
        }
    });

    // TODO: add optional context argument?
    Handlebars.registerHelper('include', function (name) {
        if (!context.handlebars[name]) {
            throw new Error('Template Not Found: ' + name);
        }
        return context.handlebars[name](this, this);
    });


    utils.find(path.resolve(p), filenameFilter(p), function (err, files) {
        if (err) {
            return cb(err);
        }
        async.forEach(files, function (f, cb) {
            fs.readFile(f, function (err, content) {
                if (err) {
                    return cb(err);
                }
                var key = path.relative(p, f);
                context.handlebars[key] = Handlebars.compile(
                    content.toString()
                );
                cb();
            });
        },
        callback);
    });
};
