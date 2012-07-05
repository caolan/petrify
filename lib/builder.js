var async = require('async'),
    events = require('events'),
    _ = require('underscore');


/**
 * Runs a build name, array or object.
 *
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

exports.run = function (tea, cfg, tasks, step, /*opt*/callback, /*opt*/ev) {
    if (!tea.context) {
        tea.context = {};
    }
    if (!ev) {
        ev = new events.EventEmitter();
    }
    if (!callback) {
        callback = exports.createCallback(ev);
    }
    process.nextTick(function () {
        if (_.isString(step)) {
            exports.runString(tea, cfg, tasks, step, callback, ev);
        }
        else if (_.isArray(step)) {
            exports.runArray(tea, cfg, tasks, step, callback, ev);
        }
        else if (_.isObject(step)) {
            exports.runObject(tea, cfg, tasks, step, callback, ev);
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

exports.runString = function (tea, cfg, tasks, step, callback, ev) {
    // run named build
    if (!cfg.builds || !cfg.builds.hasOwnProperty(step)) {
        callback('No such build "' + step + '"');
        return;
    }
    exports.run(tea, cfg, tasks, cfg.builds[step], callback, ev);
};

/**
 * Runs a build step array
 */

exports.runArray = function (tea, cfg, tasks, step, callback, ev) {
    var seq = exports.createSeqArray(step, callback);
    async.forEachSeries(seq, function (steps, cb1) {
        async.forEach(steps, function (s, cb2) {
            exports.run(tea, cfg, tasks, s.value, cb2, ev);
        }, cb1);
    }, callback);
};

/**
 * Runs a build object
 */

exports.runObject = function (tea, cfg, tasks, step, callback, ev) {
    var seq = exports.createSeqArray(step, callback);
    async.forEachSeries(seq, function (steps, cb1) {
        async.forEach(steps, function (s, cb2) {
            ev.emit('taskStart', s.name, s.value);
            tasks[s.name](tea, tea.context, s.value, function () {
                ev.emit('taskEnd', s.name, s.value);
                cb2.apply(this, arguments);
            });
        }, cb1);
    },
    function (err) {
        return callback(err, tea.context);
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
