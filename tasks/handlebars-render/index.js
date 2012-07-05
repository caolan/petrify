var minimatch = require('minimatch'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    fs = require('fs');


module.exports = function (tea, context, config, callback) {
    var templates = config.templates || [];
    var files = Object.keys(context.handlebars);

    var torender = files.filter(function (f) {
        for (var i = 0; i < templates.length; i++) {
            if (minimatch(f, templates[i])) {
                return true;
            }
        }
        return false;
    });

    async.forEachLimit(torender, 5, function (p, cb) {
        try {
            var result = context.handlebars[p](config.context || {});
        }
        catch (e) {
            return cb('Error rending template ' + p + '\n' + e.message);
        }
        var target = path.resolve(tea.target, p);
        mkdirp(path.dirname(target), function (err) {
            if (err) {
                return cb(err);
            }
            fs.writeFile(target, result, cb);
        });
    },
    callback);
};
