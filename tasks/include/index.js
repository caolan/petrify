var ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    async = require('async'),
    path = require('path'),
    pathExists = require('fs').exists || path.exists;


module.exports = function (tea, context, config, callback) {
    var paths = config.paths || [];

    async.forEach(paths, function (source, cb) {
        var dest = path.resolve(tea.target, source);
        pathExists(path.resolve(source), function (exists) {
            if (!exists) {
                return cb(path.resolve(source) + ' does not exist');
            }
            mkdirp(path.dirname(dest), function (err) {
                if (err) {
                    return cb(err);
                }
                ncp(path.resolve(source), dest, cb);
            });
        });
    },
    callback);
};
