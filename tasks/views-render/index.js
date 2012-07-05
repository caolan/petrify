var async = require('async'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs');


module.exports = function (tea, context, config, callback) {
    var errors = [];

    var q = async.queue(function (task, cb) {
        mkdirp(path.dirname(task.target), function (err) {
            if (err) {
                errors.push(err);
                tea.error(
                    'Error rendering view: ' + task.view + '\n' + err
                );
                return cb(err);
            }
            fs.writeFile(task.target, task.data, function (err) {
                if (err) {
                    errors.push(err);
                    tea.error(
                        'Error rendering view: ' + task.view + '\n' + err
                    );
                    return cb(err);
                }
                cb();
            });
        });
    }, 4);

    var createEmit = function (view) {
        return function (filename, data) {
            var target = path.resolve(tea.target, filename);
            q.push({target: target, data: data, view: view});
        };
    };

    async.forEachSeries(config.views, function (v, cb) {
        var fn = require(path.resolve(tea.source, v));
        fn(context, createEmit(v), cb);
    },
    function (err) {
        // wait for file writes to complete
        q.drain = function () {
            if (err) {
                return callback(err);
            }
            else if (errors.length) {
                return callback('Errors occurred during view execution');
            }
            callback();
        };
        if (q.length() === 0) {
            // already finished, call drain manually
            q.drain();
        }
    });
};
