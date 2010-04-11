var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    markdown = require('markdown'),
    metadata = require('metadata');

exports.readFile = function(filename, callback){
    fs.readFile(filename, function(err, data){
        if(err) callback(err, null);
        var tmp = data.split('\n\n');
        var body = tmp.slice(1).join('\n\n');
        var result = metadata.parse(tmp[0]);
        var ext = path.extname(filename);
        if(ext == '.txt' || ext == '.html'){
            result.body = body.replace(/\n$/, '');
        }
        else if(ext == '.md'){
            result.body = markdown.encode(body);
        }
        callback(null, result);
    });
};

exports.readData = function(dirname, callback){
    fs.readdir(dirname, function(err, files){
        if(err) callback(err, null);
        var data = {};
        var waiting = files.length;
        files.forEach(function(file){
            exports.readFile(path.join(dirname, file), function(err, fileData){
                if(err) callback(err, null);
                data[file] = fileData;
                waiting -= 1;
                if(!waiting){
                    callback(null, data);
                }
            });
        });
    });
};
