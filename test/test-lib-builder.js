var builder = require('../lib/builder');


exports['run object - single task'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': {
                'task1': {test: true}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            call_order.push('task1');
            test.ok(config.test);
            test.same(context, {});
            test.same(tea, {context: {}, target: 'build/output'});
            callback();
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, cfg.builds.foo, function (err) {
        test.same(call_order, ['task1']);
        test.done(err);
    });
};

exports['run object - series multiple tasks'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': {
                'task1': {test: true},
                'task2': {hello: 'world'}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                test.ok(config.test);
                test.same(context, {});
                test.same(tea, {context: {}, target: 'build/output'});
                callback();
            }, 100);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                test.strictEqual(config.hello, 'world');
                test.ok(!config.test, 'do not carry config over from prev tasks');
                test.same(context, {});
                test.same(tea, {context: {}, target: 'build/output'});
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, cfg.builds.foo, function (err) {
        test.same(call_order, ['task1', 'task2']);
        test.done(err);
    });
};

exports['run object - parallel multiple tasks'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': {
                '@task1': {test: true},
                '@task2': {hello: 'world'}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                test.ok(config.test);
                test.same(context, {});
                test.same(tea, {context: {}, target: 'build/output'});
                callback();
            }, 100);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                test.strictEqual(config.hello, 'world');
                test.ok(!config.test, 'do not carry config over from prev tasks');
                test.same(context, {});
                test.same(tea, {context: {}, target: 'build/output'});
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, cfg.builds.foo, function (err) {
        test.same(call_order, ['task2', 'task1']);
        test.done(err);
    });
};

exports['run object - mixed multiple tasks'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': {
                '@task1': {test: true},
                '@task2': {hello: 'world'},
                'task3': {step: 3}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                callback();
            }, 150);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                callback();
            }, 100);
        },
        'task3': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task3');
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, cfg.builds.foo, function (err) {
        test.same(call_order, ['task2', 'task1', 'task3']);
        test.done(err);
    });
};

exports['run object - event emitter'] = function (test) {
    var start_order = [],
        end_order = [];

    var cfg = {
        builds: {
            'foo': {
                '@task1': {test: true},
                '@task2': {hello: 'world'}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(callback, 100);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(callback, 50);
        }
    };
    var tea = {target: 'build/output'};
    var build = builder.run(tea, cfg, tasks, cfg.builds.foo);
    build.on('taskStart', function (name) {
        start_order.push(name);
    });
    build.on('taskEnd', function (name) {
        end_order.push(name);
    });
    build.on('end', function () {
        test.same(start_order, ['task1', 'task2']);
        test.same(end_order, ['task2', 'task1']);
        test.done();
    });
};

exports['run named build'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': {
                'task1': {test: true}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            call_order.push('task1');
            callback();
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, 'foo', function (err) {
        test.same(call_order, ['task1']);
        test.done(err);
    });
};

exports['run array of objects'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': [
                {
                    '@task1': {test: true},
                    '@task2': {test: true}
                },
                {
                    'task3': {test: true}
                }
            ]
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                callback();
            }, 150);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                callback();
            }, 100);
        },
        'task3': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task3');
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, 'foo', function (err) {
        test.same(call_order, ['task2', 'task1', 'task3']);
        test.done(err);
    });
};

exports['run array - named view and object'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'bar': {
                '@task1': {test: true},
                '@task2': {test: true}
            },
            'foo': ['bar', {
                'task3': {test: true}
            }]
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                callback();
            }, 150);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                callback();
            }, 100);
        },
        'task3': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task3');
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, 'foo', function (err) {
        test.same(call_order, ['task2', 'task1', 'task3']);
        test.done(err);
    });
};

exports['run array - named views in parallel'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'bar': {
                '@task1': {test: true},
                '@task2': {test: true}
            },
            'baz': {
                'task3': {test: true}
            },
            'foo': ['@bar', '@baz']
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                callback();
            }, 150);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                callback();
            }, 100);
        },
        'task3': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task3');
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, 'foo', function (err) {
        test.same(call_order, ['task3', 'task2', 'task1']);
        test.done(err);
    });
};

exports['run nested arrays'] = function (test) {
    var call_order = [];
    var cfg = {
        builds: {
            'foo': [
                [
                    {'@task1': {test: true}},
                    {'@task2': {test: true}}
                ],
                [
                    {'task3': {test: true}}
                ]
            ]
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task1');
                callback();
            }, 150);
        },
        'task2': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task2');
                callback();
            }, 100);
        },
        'task3': function (tea, context, config, callback) {
            setTimeout(function () {
                call_order.push('task3');
                callback();
            }, 50);
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, 'foo', function (err) {
        test.same(call_order, ['task1', 'task2', 'task3']);
        test.done(err);
    });
};

exports['global build context'] = function (test) {
    var cfg = {
        builds: {
            'foo': {
                'task1': {test: true},
                'task2': {hello: 'world'}
            }
        }
    };
    var tasks = {
        'task1': function (tea, context, config, callback) {
            test.same(context, {}, 'global context passed to task1');
            context.one = 1;
            context.arr = [1];
            callback();
        },
        'task2': function (tea, context, config, callback) {
            test.same(
                context, {one: 1, arr: [1]},
                'global context passed to task2'
            );
            context.two = 2;
            context.arr.push(2);
            callback();
        }
    };
    var tea = {target: 'build/output'};
    builder.run(tea, cfg, tasks, cfg.builds.foo, function (err, context) {
        test.same(context, {one: 1, two: 2, arr: [1, 2]}, 'final context');
        test.done(err);
    });
};
