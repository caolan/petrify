var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    events = require('events'),
    jsontemplate = require('json-template'),
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

exports.runViews = function(views, data, output_dir, callback){
    var names = Object.keys(views);
    if(!names.length) return callback(null);

    var completed = [];
    var partials = {};

    var emitter = new events.EventEmitter();
    emitter.addListener('viewComplete', function(){
        if(completed.length == names.length){
            callback(null);
        }
    });

    names.forEach(function(name){
        var view = views[name];
        var viewEnv = {
            emit: function(path, data){
                exports.emit(output_dir, path, data, function(err){
                    if(err) throw err;
                });
            },
            done: function(){
                completed.push(name);
                emitter.emit('viewComplete');
            }
        };
        var requires = view.requires || [];
        var ready = function(){
            return requires.reduce(function(a,x){
                return (a && completed.indexOf(x) != -1);
            }, true);
        };
        if(ready()){
            view.parse(viewEnv, data, partials);
        }
        else {
            var listener = function(){
                if(ready()){
                    emitter.removeListener('viewComplete', listener);
                    view.parse(viewEnv, data, partials);
                }
            };
            emitter.addListener('viewComplete', listener);
        }
    });
};

exports.emit = function(output_dir, path, data, callback){
    var filename = output_dir + '/' + path.replace(/^\//, '');
    fs.writeFile(filename, data, callback);
};

exports.loadTemplates = function(template_dir, callback){
    fs.readdir(template_dir, function(err, files){
        if(err) return callback(err, null);
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
