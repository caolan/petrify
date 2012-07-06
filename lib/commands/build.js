var utils = require('../utils'),
    logger = require('../logger'),
    builder = require('../builder'),
    httpserver = require('../httpserver'),
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
        'watch': {match: ['-w','--watch']},
        'server': {match: ['-s','--server']},
        'port': {match: ['-p','--port'], value: true},
        'hostname': {match: ['-H','--hostname'], value: true}
    });

    var cfg_file = path.resolve('tea.js'),
        project_dir = path.dirname(cfg_file),
        name = a.positional[0] || 'all';

    // these variables must be updated if a change to tea.js is detected
    var cfg = require(cfg_file),
        tasks = {};


    exports.loadTasks(project_dir, cfg, function (err, t) {
        if (err) {
            return logger.error(err);
        }
        // update tasks list
        tasks = t;

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

        // this must be re-bound if change to tea.js is detected
        var buildfn = async.apply(
            exports.runBuild, tea, finalp, cfg, tasks, name
        );

        buildfn(function (err) {
            building = false;
            if (err) {
                return logger.error(err);
            }
            if (!a.options.watch && !a.options.server) {
                var end = new Date().getTime();
                return logger.end(
                    path.relative(process.cwd, finalp) +
                    ' (' + (end - start) + 'ms)'
                );
            }
            if (a.options.server) {
                var opt = {
                    port: a.options.port || 8080,
                    hostname: a.options.hostname || '127.0.0.1'
                };
                httpserver.start(finalp, opt, function () {
                    logger.info(
                        'http server',
                        'Running at http://' + opt.hostname + ':' + opt.port
                    );
                });
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
                    if (queued_build) {
                        logger.info('[watch] running queued build');
                        queued_build = false;
                        process.nextTick(function () {
                            watchbuildfn();
                        });
                    }
                    if (err) {
                        logger.error(err);
                    }
                });
            }, 100);

            watch.watchTree(project_dir, options, function (f, curr, prev) {
                var rf = path.relative(project_dir, f);
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
                    logger.debug('[watch] ignoring', rf);
                    fs.unwatchFile(f);
                    return;
                }
                else {
                    logger.info('[watch] created', rf);
                }


                // if module, invalidate node's cached version
                var cached = Object.keys(require.cache);
                var resolved = require.resolve(f);
                if (_.indexOf(cached, resolved) !== -1) {
                    logger.info('[watch] purging', rf);
                    delete require.cache[resolved];
                }

                var reload_tasks = false;

                if (path.resolve(project_dir, f) === cfg_file) {
                    logger.info('[watch] config changed', rf);

                    // reload tea.js
                    logger.info('[watch] reloading config', rf);
                    cfg = require(cfg_file);

                    reload_tasks = true;
                }

                // test if we need reload a task module
                var task_paths = [];
                for (var t in (cfg.tasks || {})) {
                    task_paths.push(
                        require.resolve(
                            path.resolve(project_dir, cfg.tasks[t])
                        )
                    );
                }

                if (_.indexOf(task_paths, f) !== -1) {
                    // file is a task module, we need to reload tasks
                    reload_tasks = true;
                }

                if (reload_tasks) {
                    logger.info('[watch] reloading tasks', rf);
                    exports.loadTasks(project_dir, cfg, function (err, t) {
                        if (err) {
                            return logger.error(err);
                        }
                        tasks = t;
                        // this must be re-bound if change to tea.js is detected
                        buildfn = async.apply(
                            exports.runBuild, tea, finalp, cfg, tasks, name
                        );
                        watchbuildfn();
                    });
                }
                else {
                    watchbuildfn();
                }
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
    async.series([
        async.apply(mkdirp, tea.target),
        async.apply(exports.build, tea, cfg, tasks, name),
        async.apply(rimraf, finalp),
        async.apply(mkdirp, path.dirname(finalp)),
        async.apply(fs.rename, tea.target, finalp)
    ], callback);
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
