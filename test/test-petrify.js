var petrify = require('petrify'),
    jsontemplate = require('json-template'),
    child_process = require('child_process'),
    path = require('path'),
    fs = require('fs');


var ensureEmptyDir = function(callback){
    var dirpath = __dirname + '/fixtures/empty_dir';
    path.exists(dirpath, function(exists){
        if(!exists){
            fs.mkdir(dirpath, 0755, function(err){
                callback(err, dirpath);
            });
        }
        else {
            callback(null, dirpath);
        }
    });
};

exports.testReadFileMarkdown = function(test){
    test.expect(1);
    var filename = __dirname + '/fixtures/data/file1.md';
    petrify.readFile(filename, function(err, data){
        test.same(data, {
            filename: 'file1.md',
            key1: 'value1',
            key2: 'value2',
            body: '<h1>Test</h1>\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>'
        });
        test.done();
    });
};

exports.testReadData = function(test){
    test.expect(1);
    petrify.readData(__dirname + '/fixtures/data', function(err, data){
        data = data.sort(function(a,b){
            if(a.filename < b.filename){
                return -1;
            }
            if(a.filename > b.filename){
                return 1;
            }
            return 0;
        });
        test.same(data, [
            {
                filename: 'file1.md',
                key1:'value1',
                key2:'value2',
                body:'<h1>Test</h1>\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>'
            },
            {
                filename:'file2.md',
                key:'value',
                body:'<h1>Test 2</h1>'
            }
        ]);
        test.done();
    });
};

exports.testReadDataEmptyDir = function(test){
    test.expect(1);
    ensureEmptyDir(function(err, emptydir){
        if(err) test.ok(false, err);
        petrify.readData(emptydir, function(err, data){
            test.same(data, []);
            test.done();
        });
    });
};

exports.testLoadViewsMissingPath = function(test){
    petrify.loadViews(__dirname + '/fixtures/blah', function(err, views){
        test.ok(err instanceof Error);
        test.done();
    });
};

exports.testLoadViews = function(test){
    petrify.loadViews(__dirname + '/fixtures/views', function(err, views){
        test.same(views, {
            view1: require(__dirname + '/fixtures/views/view1'),
            view2: require(__dirname + '/fixtures/views/view2')
        });
        test.done();
    });
};

exports.testLoadViewsEmptyDir = function(test){
    test.expect(1);
    ensureEmptyDir(function(err, emptydir){
        if(err) test.ok(false, err);
        petrify.loadViews(emptydir, function(err, views){
            test.same(views, {});
            test.done();
        });
    });
};

exports.testRunViewsEmpty = function(test){
    petrify.runViews({
        views: {}, data: [], templates: {}, output_dir: ''
    }, function(err){
        test.done();
    });
};

exports.testRunViewsSingle = function(test){
    test.expect(5);
    var testdata = [{test: 'test'}];
    var views = {
        view1: {parse: function(view, templates, data, partials){
            test.ok(view.emit instanceof Function);
            test.ok(view.done instanceof Function);
            test.same(templates, {test:'templates'});
            test.same(data, testdata);
            test.same(partials, {});
            view.done();
        }}
    };
    petrify.runViews({
        views: views,
        data: testdata,
        templates: {test:'templates'},
        output_dir: ''
    }, function(err){
        test.done();
    });
};

exports.testRunViewsDependencies = function(test){
    var callOrder = [];
    var testdata = [{test: 'test'}];
    var views = {
        view1: {
            requires: ['view2'],
            parse: function(view, templates, data, partials){
                setTimeout(function(){
                    callOrder.push('view1');
                    view.done();
                }, 100);
            }
        },
        view2: {parse: function(view, templates, data, partials){
            setTimeout(function(){
                callOrder.push('view2');
                view.done();
            }, 200);
        }},
        view3: {
            requires: ['view2'],
            parse: function(view, templates, data, partials){
                callOrder.push('view3');
                view.done();
            }
        },
        view4: {
            requires: ['view1', 'view2'],
            parse: function(view, templates, data, partials){
                callOrder.push('view4');
                view.done();
            }
        }
    };
    petrify.runViews({
        views: views,
        data: testdata,
        templates: {},
        output_dir: ''
    }, function(err){
        test.same(callOrder, ['view2','view3','view1','view4']);
        test.done();
    });
};

exports.testRunViewsEmit = function(test){
    test.expect(3);
    var emit_copy = petrify.emit;
    petrify.emit = function(output_dir, path, data, callback){
        test.equals(output_dir, 'output_dir');
        test.equals(path, '/somepath');
        test.equals(data, 'some data');
        callback();
    };
    var views = {
        view1: {parse: function(view, templates, data, partials){
            view.emit('/somepath', 'some data');
            view.done();
        }}
    };
    petrify.runViews({
        views: views,
        data: [],
        templates: {},
        output_dir: 'output_dir'
    }, function(err){
        petrify.emit = emit_copy;
        test.done();
    });
};

exports.testRunViewsPartials = function(test){
    test.expect(2);
    var views = {
        view1: {
            requires: [],
            parse: function(view, templates, data, partials){
                test.same(partials, {})
                partials.test = 'partial';
                view.done();
            }
        },
        view2: {
            requires: ['view1'],
            parse: function(view, templates, data, partials){
                test.same(partials, {test:'partial'})
                view.done();
            }
        }
    };
    petrify.runViews({
        views: views,
        data: [],
        templates: {},
        output_dir: 'output_dir'
    }, function(err){
        test.done();
    });
};

exports.testEmit = function(test){
    test.expect(2);
    var writeFile_copy = fs.writeFile;
    fs.writeFile = function(filename, data, callback){
        test.equals(filename, __dirname + '/fixtures/www/testpath');
        test.equals(data, 'some data');
        callback();
    };
    var output_dir = __dirname + '/fixtures/www';
    petrify.emit(output_dir, '/testpath', 'some data', function(err){
        fs.writeFile = writeFile_copy;
        test.done();
    });
};

exports.testEmitNoLeadingSlash = function(test){
    test.expect(2);
    var writeFile_copy = fs.writeFile;
    fs.writeFile = function(filename, data, callback){
        test.equals(filename, __dirname + '/fixtures/www/testpath');
        test.equals(data, 'some data');
        callback();
    };
    var output_dir = __dirname + '/fixtures/www';
    petrify.emit(output_dir, 'testpath', 'some data', function(err){
        fs.writeFile = writeFile_copy;
        test.done();
    });
};

exports.testEmitError = function(test){
    test.expect(1);
    var writeFile_copy = fs.writeFile;
    fs.writeFile = function(filename, data, callback){
        callback('error');
    };
    var output_dir = __dirname + '/fixtures/www';
    petrify.emit(output_dir, 'testpath', 'some data', function(err){
        test.equals(err, 'error');
        fs.writeFile = writeFile_copy;
        test.done();
    });
};

exports.testEmitSubDir = function(test){
    test.expect(4);
    var output_dir = __dirname + '/filename/www';
    var call_order = [];
    var exec_copy = child_process.exec;
    child_process.exec = function(command, callback){
        test.same(command, 'mkdir -p ' + output_dir + '/subdir');
        call_order.push('mkdir');
        callback();
    };
    var writeFile_copy = fs.writeFile;
    fs.writeFile = function(filename, data, callback){
        test.equals(filename, output_dir + '/subdir/testpath');
        test.equals(data, 'some data');
        call_order.push('writeFile');
        callback();
    };
    petrify.emit(output_dir, '/subdir/testpath', 'some data', function(err){
        test.same(call_order, ['mkdir','writeFile']);
        fs.writeFile = writeFile_copy;
        child_process.exec = exec_copy;
        test.done();
    });
};

exports.testLoadTemplates = function(test){
    var template_dir = __dirname + '/fixtures/templates';

    petrify.loadTemplates(template_dir, function(err, templates){
        test.equals(
            templates['testtemplate.jsont'].expand({name:'world'}),
            'Hello world!\n'
        );
        test.done();
    });
};

exports.testLoadTemplatesEmptyDir = function(test){
    test.expect(1);
    ensureEmptyDir(function(err, emptydir){
        if(err) test.ok(false, err);
        petrify.loadTemplates(emptydir, function(err, templates){
            test.same(templates, {});
            test.done();
        });
    });
};

exports.testRun = function(test){
    test.expect(10);
    var call_order = [];
    var options = {
        template_dir: 'template_dir',
        output_dir: __dirname + '/fixtures/dir_exists',
        view_dir: 'view_dir',
        data_dir: 'data_dir'
    };
    var loadTemplates_copy = petrify.loadTemplates;
    petrify.loadTemplates = function(template_dir, callback){
        test.equals(template_dir, options.template_dir);
        call_order.push('loadTemplates');
        callback(null, 'templates');
    };
    var loadViews_copy = petrify.loadViews;
    petrify.loadViews = function(view_dir, callback){
        test.equals(view_dir, options.view_dir);
        call_order.push('loadViews');
        callback(null, 'views');
    };
    var readData_copy = petrify.readData;
    petrify.readData = function(data_dir, callback){
        test.equals(data_dir, options.data_dir);
        call_order.push('readData');
        callback(null, 'data');
    };
    var runViews_copy = petrify.runViews;
    petrify.runViews = function(opts, callback){
        test.equals(opts.views, 'views');
        test.equals(opts.data, 'data');
        test.equals(opts.templates, 'templates');
        test.equals(opts.output_dir, options.output_dir);
        call_order.push('runViews');
        callback();
    };

    var exec_copy = child_process.exec;
    child_process.exec = function(command, callback){
        call_order.push('rm');
        test.same(command, 'rm -r ' + options.output_dir);
        child_process.exec = function(command, callback){
            call_order.push('mkdir');
            test.same(command, 'mkdir ' + options.output_dir);
            callback();
        };
        callback();
    };

    petrify.run(options, function(err){
        // runViews should run last
        test.ok(call_order[call_order.length-1], 'runViews');
        petrify.loadTemplates = loadTemplates_copy;
        petrify.loadViews = loadViews_copy;
        petrify.readData = readData_copy;
        petrify.runViews = runViews_copy;
        child_process.exec = exec_copy;
        test.done();
    });
};
