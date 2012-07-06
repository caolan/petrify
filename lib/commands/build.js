var utils = require('../utils'),
    logger = require('../logger'),
    builder = require('../builder'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    watch = require('watch'),
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
        'output': {match: ['-o','--output'], value: true},
        'watch': {match: ['-w','--watch']}
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

        // location to mv .tea-build to if build is successful
        var finalp;
        if (a.options.output) {
            finalp = path.resolve(project_dir, a.options.output);
        }
        else {
            finalp = path.resolve(project_dir, 'build', name);
        }

        // used by watch functions to avoid running concurrent builds
        var building = true;

        var buildfn = async.apply(
            exports.runBuild, tea, finalp, cfg, tasks, name
        );
        buildfn(function (err) {
            building = false;
            if (err) {
                return logger.error(err);
            }
            if (!a.options.watch) {
                var end = new Date().getTime();
                return logger.end(
                    path.relative(process.cwd, finalp) +
                    ' (' + (end - start) + 'ms)'
                );
            }
        });

        if (a.options.watch) {
            var queued_build = false;
            var options = {
                ignoreDotFiles: true,
                filter: function (f, stat) {
                    // add hidden file and directory test here too because
                    // watch lib isn't respecting it on new directory creation
                    var relpath = path.relative(project_dir, f);
                    var parts = f.split(path.sep);
                    for (var i = 0; i < parts.length; i++) {
                        if (parts[i][0] === '.') {
                            return true;
                        }
                    }
                    var tmpdir = path.resolve(project_dir, '.tea-build');
                    var r = (
                        utils.isSubPath(path.resolve(project_dir, f), tmpdir) ||
                        utils.isSubPath(path.resolve(project_dir, f), finalp) ||
                        path.extname(f) === '.swp'
                    );
                    return r;
                }
            };
            var watchbuildfn = _.debounce(function () {
                if (building) {
                    queued_build = true;
                    return;
                }
                building = true;
                logger.info('[watch] building', name);
                buildfn(function (err) {
                    building = false;
                    if (err) {
                        logger.error(err);
                    }
                    if (queued_build) {
                        logger.info('[watch] running queued build');
                        queued_build = false;
                        watchbuildfn();
                    }
                });
            }, 100);

            watch.watchTree(project_dir, options, function (f, curr, prev) {
                var msg;
                if (typeof f == "object" && prev === null && curr === null) {
                    // Finished walking the tree
                    return logger.debug('[watch] ready', project_dir);
                }
                else if (prev === null) {
                    msg = 'created';
                }
                else if (curr.nlink === 0) {
                    msg = 'removed';
                }
                else {
                    msg = 'changed';
                }
                if (options.filter(f)) {
                    logger.debug('[watch] ignoring', f);
                    fs.unwatchFile(f);
                    return;
                }
                else {
                    logger.info('[watch] created', f);
                }
                watchbuildfn();
            });
        }

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

exports.runBuild = function (tea, finalp, cfg, tasks, name, callback) {
    mkdirp(tea.target, function (err) {
        if (err) {
            return logger.error(err);
        }
        exports.build(tea, cfg, tasks, name, function (err) {
            if (err) {
                return logger.error(err);
            }
            // if build was successful, do mv to final location
            rimraf(finalp, function (err) {
                mkdirp(path.dirname(finalp), function (err) {
                    if (err) {
                        return logger.error(err);
                    }
                    fs.rename(tea.target, finalp, callback);
                });
            });
        });
    });
};

exports.build = function (tea, cfg, tasks, name, callback) {
    var b = builder.run(tea, cfg, tasks, cfg.builds[name], callback);
    b.on('taskStart', function (name) {
        logger.info('starting', name);
    });
    b.on('taskEnd', function (name) {
        logger.info('finished', name);
    });
};
