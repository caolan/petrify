var fs = require('fs'),
    async = require('async'),s
    path = require('path');


/**
 * Gets all descendents of a path and tests against a regular expression,
 * returning all matching file paths.
 *
 * @param {String} p
 * @param {RegExp} pattern
 * @param {Function} callback
 * @api public
 */

exports.find = function (p, test, callback) {
    if (test instanceof RegExp) {
        var re = test;
        test = function (f) {
            return re.test(f);
        };
    }
    exports.descendants(p, function (err, files) {
        if (err) {
            return callback(err);
        }
        if (!Array.isArray(files)) {
            files = files ? [files]: [];
        }
        var matches = files.filter(function (f) {
            return test(f);
        });
        callback(null, matches);
    });
};


/**
 * List all files below a given path, recursing through subdirectories.
 *
 * @param {String} p
 * @param {Function} callback
 * @api public
 */

exports.descendants = function (p, callback) {
    fs.stat(p, function (err, stats) {
        if (err) {
            return callback(err);
        }
        if (stats.isDirectory()) {
            fs.readdir(p, function (err, files) {
                if (err) {
                    return callback(err);
                }
                var paths = files.map(function (f) {
                    return path.resolve(p, f);
                });
                async.concat(paths, exports.descendants, function (err, files) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(err, files);
                    }
                });
            });
        }
        else if (stats.isFile()) {
            callback(null, p);
        }
    });
};
