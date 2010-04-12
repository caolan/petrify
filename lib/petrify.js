var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
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

exports.runViews = function(modules){
    modules.forEach(function(m){
        m.parse();
    });
};
