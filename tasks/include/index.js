var ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    async = require('async'),
    path = require('path'),
    pathExists = require('fs').exists || path.exists;


module.exports = function (tea, context, config, callback) {
    var paths = config.paths || [];

    if (Array.isArray(paths)) {
        async.forEach(paths, function (p, cb) {
            var dest = path.resolve(tea.target, p);
            var source = path.resolve(tea.source, p);
            exports.includePath(path.resolve(source), dest, cb);
        },
        callback);
    }
    else if (typeof paths === 'object') {
        async.forEach(Object.keys(paths), function (k, cb) {
            var dest = path.resolve(tea.target, k);
            var source = path.resolve(tea.source, paths[k]);
            exports.includePath(path.resolve(source), dest, cb);
        },
        callback);
    }
    else {
        return callback('Unexpected type for paths config option: ' + paths);
    }
};

exports.includePath = function (source, dest, callback) {
    pathExists(source, function (exists) {
        if (!exists) {
            return callback(source + ' does not exist');
        }
        mkdirp(path.dirname(dest), function (err) {
            if (err) {
                return callback(err);
            }
            ncp(source, dest, callback);
        });
    });
};
