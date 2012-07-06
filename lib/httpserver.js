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
            // request not handled by ecstatic middleware for some reason
            var body = 'Request not handled by ecstatic';
            res.writeHead(500, {
               'Content-Length': body.length,
               'Content-Type': 'text/plain'
            });
            res.end(body);
        });
    });
    server.listen(options.port, options.hostname, callback);
};
