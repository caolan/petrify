var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    events = require('events'),
    run = require('run'),
    jsontemplate = require('json-template'),
    child_process = require('child_process'),
    markdown = require('markdown'),
    metadata = require('metadata');


exports.readFile = function(filename, callback){
    fs.readFile(filename, function(err, data){
        if(err) return callback(err, null);
        var ext = path.extname(filename);
        if(ext == '.md'){
            var tmp = data.split('\n\n');
            var body = tmp.slice(1).join('\n\n');
            var result = metadata.parse(tmp[0]);
            result.body = markdown.encode(body);
            result.filename = path.basename(filename);
            callback(null, result);
        }
        else {
            callback(new Error('Unknown format: ' + ext), null);
        }
    });
};

exports.readData = function(dirname, callback){
    fs.readdir(dirname, function(err, files){
        if(err) return callback(err, null);
        if(!files.length) return callback(null, []);
        var data = [];
        var waiting = files.length;
        files.forEach(function(file){
            exports.readFile(path.join(dirname, file), function(err, fileData){
                if(err) callback(err, null);
                data.push(fileData);
                waiting -= 1;
                if(!waiting){
                    callback(null, data);
                }
            });
        });
    });
};

exports.loadViews = function(dirname, callback){
    fs.readdir(dirname, function(err, files){
        if(err) return callback(err, null);
        if(!files.length) return callback(null, {});
        callback(null, files.reduce(function(a,x){
            var basename = path.basename(x);
            if(/\.js$/.exec(basename)){
                var module_name = basename.replace(/\.js$/,'');
                a[module_name] = require(path.join(dirname, module_name));
            }
            return a;
        }, {}));
    });
};

exports.runViews = function(opts, callback){
    var partials = {};
    var tasks = Object.keys(opts.views).reduce(function(a,k){
        var view = opts.views[k];
        a[k] = run.requires(view.requires, function(task){
            var viewEnv = {
                emit: function(path, data){
                    exports.emit(opts.output_dir, path, data, function(err){
                        if(err) throw err;
                    });
                },
                done: task.done
            };
            view.parse(viewEnv, opts.templates, opts.data, partials);
        });
        return a;
    }, {});
    run.auto(tasks, callback);
};

exports.emit = function(output_dir, path, data, callback){
    var filename = output_dir + '/' + path.replace(/^\//, '');
    fs.writeFile(filename, data, callback);
};

exports.loadTemplates = function(template_dir, callback){
    fs.readdir(template_dir, function(err, files){
        if(err) return callback(err, null);
        if(!files.length) return callback(null, {});
        var templates = {};
        var waiting = files.length;
        files.forEach(function(file){
            fs.readFile(path.join(template_dir, file), function(err, data){
                if(err) callback(err, null);
                templates[file] = new jsontemplate.Template(data);
                waiting -= 1;
                if(!waiting){
                    callback(null, templates);
                }
            });
        });
    });
};

exports.run = function(opt, callback){
    run.auto({
        templates: function(task){
            exports.loadTemplates(opt.template_dir, function(err, templates){
                opt.templates = templates;
                task.done();
            });
        },
        views: function(task){
            exports.loadViews(opt.view_dir, function(err, views){
                opt.views = views;
                task.done();
            });
        },
        data: function(task){
            exports.readData(opt.data_dir, function(err, data){
                opt.data = data;
                task.done();
            });
        },
        removedir: function(task){
            child_process.exec('rm -r ' + opt.output_dir, function(err){
                task.done();
            });
        },
        mkdir: run.requires(['removedir'], function(task){
            child_process.exec('mkdir ' + opt.output_dir, function(err){
                task.done();
            });
       })
    }, function(){
        exports.runViews(opt, callback);
    });
};
