var utils = require('../utils'),
    logger = require('../logger'),
    builder = require('../builder'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    argParse = require('../args').parse;


exports.summary = 'Generate a build defined in a tea.json file';

exports.usage = '' +
    'tea build [NAME...]\n' +
    '\n' +
    'Parameters:\n' +
    '  NAME    The build name to run (defaults to "all")';


exports.run = function (settings, args) {
    var start = new Date().getTime();

    var a = argParse(args, {
        'target': {match: ['-t','--target'], value: true}
    });

    var cfg_file = path.resolve('tea.js');

    var cfg = require(cfg_file),
        project_dir = path.dirname(cfg_file),
        name = a.positional[0] || 'all';

    exports.loadTasks(project_dir, cfg, function (err, tasks) {
        if (err) {
            return logger.error(err);
        }

        var tea = {
            target: path.resolve(project_dir, '.tea-build'),
            source: project_dir
        };

        mkdirp(tea.target, function (err) {
            if (err) {
                return logger.error(err);
            }
            exports.build(tea, cfg, tasks, name, function (err) {
                if (err) {
                    return logger.error(err);
                }
                // if build was successful, do mv to final location
                var final_target = path.resolve(project_dir, 'build', name);
                rimraf(final_target, function (err) {
                    mkdirp(path.dirname(final_target), function (err) {
                        if (err) {
                            return logger.error(err);
                        }
                        fs.rename(tea.target, final_target, function (err) {
                            if (err) {
                                return logger.error(err);
                            }
                            var end = new Date().getTime();
                            return logger.end(
                                path.relative(process.cwd, final_target) +
                                ' (' + (end - start) + 'ms)'
                            );
                        });
                    });
                });
            });
        });

    });
};

exports.build = function (tea, cfg, tasks, name, callback) {
    var b = builder.run(tea, cfg, tasks, cfg.builds[name], callback);
    b.on('taskStart', function (name) {
        logger.info('start', name);
    });
    b.on('taskEnd', function (name) {
        logger.info('end', name);
    });
};

exports.loadTasks = function (project_dir, cfg, callback) {
    var tasks = {};
    var names = Object.keys(cfg.tasks || {});
    var builtin_path = path.resolve(__dirname, '../../tasks');

    fs.readdir(builtin_path, function (err, files) {
        if (err) {
            return callback(err);
        }

        // load builtin tasks
        files.forEach(function (f) {
            tasks[f] = require(path.resolve(builtin_path, f));
        });

        // load task paths specified in tea.js
        names.forEach(function (n, cb) {
            tasks[n] = require(path.resolve(project_dir, cfg.tasks[n]));
        });

        return callback(null, tasks);
    });

};
