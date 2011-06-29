#!/usr/bin/env node

require.paths.push(__dirname);
require.paths.push(__dirname + '/../lib');
require.paths.push(__dirname + '/../deps');
require.paths.push(__dirname + '/../deps/json-template/lib');
require.paths.push(__dirname + '/../deps/markdown-js/lib');

var buildrunner = require('buildrunner');

buildrunner.run({
    data_dir: __dirname + '/data',
    view_dir: __dirname + '/views',
    template_dir: __dirname + '/templates',
    output_dir: __dirname + '/www',
    media_dirs: [__dirname + '/media']
});
