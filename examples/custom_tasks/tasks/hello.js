var fs = require('fs'),
    path = require('path');


module.exports = function (tea, context, config, callback) {
    var filename = path.resolve(tea.target, 'hello.txt'),
        content = 'Hello, ' + config.name + '!';

    fs.writeFile(filename, content, callback);
};
