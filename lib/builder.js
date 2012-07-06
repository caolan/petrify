var fs = require('fs'),
    async = require('async'),
    events = require('events'),
    mkdirp = require('mkdirp'),
    logger = require('./logger'),
    _ = require('underscore');


/**
 * Runs a build name, array or object.
 *
 * @param {Object} opt - context object, target path, source path etc. these
 *                       values get added to the tea object passed to tasks
 * @param {Object} cfg - values from tea.json
 * @param {Object} tasks - the available task functions keyed by name
 * @param {String|Array|Object} step - the build step to run
 * @param {Function} callback - function to call on completion (optional)
 * @param {EventEmitter} ev - an event emitter to use for all sub-calls,
 *     you shouldn't need to pass this in manually as it is created on the
 *     first call (optional)
 *
 * @returns {EventEmitter}
 */

exports.run = function (opt, cfg, tasks, step, /*opt*/callback, /*opt*/ev) {
    if (!opt.context) {
        opt.context = {};
    }
    if (!ev) {
        ev = new events.EventEmitter();
    }
    if (!callback) {
        callback = exports.createCallback(ev);
    }
    process.nextTick(function () {
        if (_.isString(step)) {
            exports.runString(opt, cfg, tasks, step, callback, ev);
        }
        else if (_.isArray(step)) {
            exports.runArray(opt, cfg, tasks, step, callback, ev);
        }
        else if (_.isObject(step)) {
            exports.runObject(opt, cfg, tasks, step, callback, ev);
        }
        else {
            callback('Unexpected type: ' + step);
            return;
        }
    });
    return ev;
};


/**
 * Creates a callback function which passes errors to the provided event emitter
 * and calls 'end' on the event emitter.
 *
 * @param {EventEmitter} ev - the event emitter to call error and end events on
 * @returns {Function} the new callback function
 */

exports.createCallback = function (ev) {
    return function (err) {
        if (err) {
            ev.emit('error', err);
        }
        ev.emit('end');
    };
};


/**
 * Runs a named build
 */

exports.runString = function (opt, cfg, tasks, step, callback, ev) {
    // run named build
    if (!cfg.builds || !cfg.builds.hasOwnProperty(step)) {
        callback('No such build "' + step + '"');
        return;
    }
    exports.run(opt, cfg, tasks, cfg.builds[step], callback, ev);
};

/**
 * Runs a build step array
 */

exports.runArray = function (opt, cfg, tasks, step, callback, ev) {
    var seq = exports.createSeqArray(step, callback);
    async.forEachSeries(seq, function (steps, cb1) {
        async.forEach(steps, function (s, cb2) {
            exports.run(opt, cfg, tasks, s.value, cb2, ev);
        }, cb1);
    }, callback);
};

/**
 * Runs a build object
 */

exports.runObject = function (opt, cfg, tasks, step, callback, ev) {
    var seq = exports.createSeqArray(step, callback);

    async.forEachSeries(seq, function (steps, cb1) {
        async.forEach(steps, function (s, cb2) {

            ev.emit('taskStart', s.name, s.value);
            var tea = new exports.Tea(s.name, opt);

            tasks[s.name](tea, opt.context, s.value, function () {
                var args = Array.prototype.slice.call(arguments);
                tea.waitForWrites(function (err) {
                    if (err) {
                        return cb2(err);
                    }
                    ev.emit('taskEnd', s.name, s.value);
                    cb2.apply(null, args);
                });
            });

        }, cb1);
    },
    function (err) {
        return callback(err, opt.context);
    });
};


/**
 * Turns a build object into an array of arrays representing the order
 * to run tasks in and which ones to run in parallel.
 *
 * Eg, [[foo],[bar,baz],[qux]] would run foo, once foo is complete it would
 * then run bar and baz in parallel, then finally run qux (after bar and baz
 * have both completed).
 *
 * Bear in mind that Tea may be running multiple sequence arrays at once,
 * however. Since named builds can also be run in parallel.
 *
 * @param {Object} obj - the bulid steps object to create a seq array for
 * @returns {Array} returns the sequence array
 */

exports.createSeqArray = function (obj) {
    var seq = [[]];

    for (var k in obj) {
        if (k[0] === '@') {
            // run object property parallel
            seq[seq.length - 1].push({name: k.substr(1), value: obj[k]});
        }
        else if (_.isString(obj[k]) && obj[k][0] === '@') {
            // run named build in parallel
            seq[seq.length - 1].push({name: k, value: obj[k].substr(1)});
        }
        else {
            // create new list of events
            seq.push([{name: k, value: obj[k]}]);
        }
    }
    return seq;
};


var Tea = exports.Tea = function Tea(task, opt) {
    var that = this;

    this.errors = [];
    this.task = task;
    this.q = async.queue(function (task, cb) {
        mkdirp(path.dirname(task.target), function (err) {
            if (err) {
                that.errors.push(err);
                that.error(err);
                return cb(err);
            }
            fs.writeFile(task.target, task.data, function (err) {
                if (err) {
                    that.errors.push(err);
                    that.error(err);
                    return cb(err);
                }
                cb();
            });
        });
    }, 4);

    _.extend(this, opt);
};

Tea.prototype.error = function (err) {
    logger.error('Error running task: ' + this.task + '\n' + err);
};
Tea.prototype.info = function (msg) {
    logger.info(this.task, msg);
};
Tea.prototype.warn = function (msg) {
    logger.warning(this.task, msg);
};
Tea.prototype.debug = function (val) {
    logger.debug(this.task, val);
};

Tea.prototype.emit = function (filename, data) {
    logger.debug('emit', filename);
    var target = path.resolve(this.target, filename);
    this.q.push({target: target, data: data, task: this.task});
};

Tea.prototype.waitForWrites = function (callback) {
    var that = this;

    // wait for file writes to complete
    this.q.drain = function () {
        if (that.errors.length) {
            return callback('Errors when running task: ' + that.task);
        }
        callback();
    };
    if (this.q.length() === 0) {
        // already finished, call drain manually
        this.q.drain();
    }
};
