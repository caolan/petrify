var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    run = require('run'),
    behaviours = require('behaviours'),
    jsontemplate = require('json-template'),
    child_process = require('child_process'),
    markdown = require('markdown');


// iterates over a directory of files where the filename matches a regexp
exports.withFiles = function(dirname, pattern, fn, callback){
    fs.readdir(dirname, function(err, files){
        if(err) return callback(err);

        // only iterate over files matching pattern
        files = files.filter(function(file){return pattern.test(file);});

        var waiting = files.length;
        if(!waiting){
            return callback(null);
        }

        files.forEach(function(filename){
            fs.readFile(path.join(dirname, filename), function(err, data){
                if(err){
                    callback(err);
                    // stop callback being run by other readFile calls
                    callback = function(){};
                }
                else {
                    fn(filename, data);
                }
                waiting -= 1;
                if(!waiting){
                    callback(null);
                }
            });
        });

    });
};

// require()'s modules from a directory and returns an object containing
// all of the results. Tests the exported properties of the modules to ensure
// the correct callbacks exist.
exports.loadViews = function(dirname, callback){
    fs.readdir(dirname, function(err, files){
        if(err) return callback(err, null);
        if(!files.length) return callback(null, {});
        callback(null, files.reduce(function(a,x){
            var basename = path.basename(x);
            if(/\.js$/.exec(basename)){
                var module_name = basename.replace(/\.js$/,'');
                a[module_name] = behaviours.require(
                    path.join(dirname, module_name),
                    {run: Function, requires: [Array, undefined]}
                );
            }
            return a;
        }, {}));
    });
};

// calls the 'run' callback on each view module, once exports.requirements have
// all completed processing.
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
                done: function(){
                    if(opts.onViewDone) opts.onViewDone(k);
                    task.done();
                }
            };
            try {
                if(opts.onViewStart) opts.onViewStart(k);
                view.run(viewEnv, {
                    templates: opts.templates,
                    data: opts.data,
                    partials: partials
                });
            }
            catch(e){
                //callback(e, null);
                sys.puts('Error running view: ' + k);
                sys.puts('\t' + (e.stack || e.message || e));
            }
        });
        return a;
    }, {});
    run.auto(tasks, callback);
};

// saves data to the output directory, safely ignores url style leading slash,
// but does allow ability to emit outside of the directory using ../
exports.emit = function(output_dir, urlpath, data, callback){
    var filename = path.normalize(output_dir+'/'+urlpath.replace(/^\//, ''));
    var dirname = path.dirname(filename);
    output_dir = path.normalize(output_dir);
    // is filename a subdirectory of output_dir?
    if(filename.substr(0, output_dir.length) == path.normalize(output_dir)){
        path.exists(dirname, function(exists){
            if(!exists){
                child_process.exec('mkdir -p ' + dirname, function(err){
                    fs.writeFile(filename, data, callback);
                });
            }
            else {
                fs.writeFile(filename, data, callback);
            }
        });
    }
    else {
        callback(new Error('Attempted to emit file outside of output dir'));
    }
};

// parses markdown files exposing the metadata, html, jsonml, first h1 heading
// and filename as properties
exports.readFile = function(filename, data){
    var dialect = markdown.Markdown.dialects.Maruku;
    var jsonml = markdown.parse(data, dialect);
    var result = {};
    if(jsonml.length > 1 && !(jsonml[1] instanceof Array)){
        result.meta = jsonml[1];
    }
    result.heading = (function(){
        for(var i=0; i<jsonml.length; i++){
            var x = jsonml[i];
            if(x instanceof Array){
                if(x[0] == 'header' && x[1].level == 1){
                    return x[2];
                }
            }
        }
    })();
    result.jsonml = jsonml;
    result.html = markdown.toHTML(jsonml);

    var found_header = false;
    result.html_no_heading = markdown.toHTML(jsonml.filter(function(x){
        if(x instanceof Array){
            if(x[0] == 'header' && x[1].level == 1 && !found_header){
                found_header = true;
                return false;
            }
        }
        return true;
    }));

    result.filename = path.basename(filename);
    return result;
};

// reads markdown files form a data directory, passing an array of the
// results to a callback
exports.loadData = function(dirname, callback){
    var data = [];
    exports.withFiles(dirname, /.*\.md$/, function(filename, fileData){
        data.push(exports.readFile(filename, fileData));
    }, function(err){
        callback(err, data);
    });
};

// reads jsont templates from a template directory, passing an object
// containing getters for parsing the templates keyed by filename
exports.loadTemplates = function(template_dir, callback){
    var templates = {};
    exports.withFiles(template_dir, /.*\.jsont$/, function(filename, data){
        var cache;
        templates.__defineGetter__(filename, function(){
            if(!cache){
                cache = new jsontemplate.Template(data);
                cache._expand = cache.expand;
                cache.expand = function(){
                    try {
                        return cache._expand.apply(cache, arguments);
                    }
                    catch (e){
                        // add a more helpful error message:
                        e.message = "Error expanding template '" +
                            filename + "': " + e.message;
                        throw e;
                    }
                };
            }
            return cache;
        });
    }, function(err){
        callback(null, templates);
    });
};

// builds a site
exports.run = function(opt, callback){
    run.auto({
        templates: function(task){
            exports.loadTemplates(opt.template_dir, function(err, templates){
                if(err) sys.puts(err);
                else {
                    opt.templates = templates;
                    task.done();
                }
            });
        },
        views: function(task){
            exports.loadViews(opt.view_dir, function(err, views){
                if(err) sys.puts(err);
                else {
                    opt.views = views;
                    task.done();
                }
            });
        },
        data: function(task){
            exports.loadData(opt.data_dir, function(err, data){
                if(err) sys.puts(err);
                else {
                    opt.data = data;
                    task.done();
                }
            });
        },
        removedir: function(task){
            child_process.exec('rm -r ' + opt.output_dir, function(err){
                if(err) sys.puts(err);
                else {
                    task.done();
                }
            });
        },
        mkdir: run.requires(['removedir'], function(task){
            child_process.exec('mkdir ' + opt.output_dir, function(err){
                if(err) sys.puts(err);
                else {
                    task.done();
                }
            });
       })
    }, function(){
        exports.runViews(opt, callback);
    });
};
