var http = require('http'),
    ecstatic = require('ecstatic'),
    logger = require('./logger'),
    _ = require('underscore');


exports.start = function (root, options, callback) {
    options = _.defaults(options || {}, {
        port: 8080,
        hostname: '127.0.0.1',
        autoIndex: true,
        cache: 3600 // in seconds
    });
    var middleware = ecstatic(root, options);
    var server = http.createServer(function (req, res) {
        middleware(req, res, function () {
            var body = '<h1>404 Not found</h1>';
            res.writeHead(404, {
               'Content-Length': body.length,
               'Content-Type': 'text/html'
            });
            res.end(body);
        });
    });
    server.listen(options.port, options.hostname, callback);
};
