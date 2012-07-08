var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    wmd = require('wmd'),
    yaml = require('js-yaml'),
    _ = require('underscore');


function filenameFilter(p) {
    return function (f) {
        var relpath = path.relative(p, f);
        // should not start with a '.'
        if (/^\./.test(relpath)) {
            return false;
        }
        // should not contain a file or folder starting with a '.'
        if (/\/\./.test(relpath)) {
            return false;
        }
        var ext = path.extname(f);
        // only load supported file types
        return (ext === '.md' || ext === '.markdown' || ext === '.json');
    };
}


module.exports = function (tea, context, config, callback) {
    context.data = [];

    var p = config.path;
    if (!p) {
        return callback('No path specified');
    }

    utils.find(path.resolve(p), filenameFilter(p), function (err, files) {
        if (err) {
            return cb(err);
        }
        async.forEach(files, function (f, cb) {
            fs.readFile(f, function (err, content) {
                if (err) {
                    return cb(err);
                }
                var k = path.relative(p, f);
                try {
                    context.data.push(exports.loadFile(f, content.toString()))
                }
                catch (e) {
                    return cb(e);
                }
                cb();
            });
        },
        callback);
    });
};


exports.loadFile = function (filename, data) {
    var ext = path.extname(filename);
    if (ext === '.json') {
        var doc = JSON.parse(data);
        doc.__format = 'json';
    }
    if (ext === '.yml' || ext === '.yaml') {
        var doc = yaml.load(data);
        doc.__format = 'yaml';
    }
    if (ext === '.md' || ext === '.markdown') {
        var r = wmd(data, {
            preprocessors: [
                wmd.preprocessors.yamlFrontMatter,
                wmd.preprocessors.fencedCodeBlocksHighlightJS,
                wmd.preprocessors.underscores
            ]
        });
        var doc = _.extend(r.metadata, {
            __format: 'markdown',
            body: r.markdown,
            html: r.html
        });
    }
    return _.extend(doc, {
        __filename: filename,
        __raw: data
    });
};
