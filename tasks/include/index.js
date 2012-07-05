var ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    async = require('async'),
    path = require('path');


module.exports = function (tea, context, config, callback) {
    var paths = config.paths || [];

    async.forEach(paths, function (source, cb) {
        var dest = path.resolve(tea.target, source);
        mkdirp(path.dirname(dest), function (err) {
            if (err) {
                return cb(err);
            }
            ncp(path.resolve(source), dest, cb);
        });
    },
    callback);
};
