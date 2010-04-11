var petrify = require('petrify');

exports.testReadFileTxt = function(test){
    test.expect(1);
    var filename = __dirname + '/fixtures/data/file1.txt';
    petrify.readFile(filename, function(err, data){
        test.same(data, {
            key1: 'value1',
            key2: 'value2',
            body: 'some text\nsome more text'
        });
        test.done();
    });
};

exports.testReadFileHTML = function(test){
    test.expect(1);
    var filename = __dirname + '/fixtures/data/file2.html';
    petrify.readFile(filename, function(err, data){
        test.same(data, {
            key1: 'value1',
            key2: 'value2',
            body: '<h1>Test</h1>'
        });
        test.done();
    });
};

exports.testReadFileMarkdown = function(test){
    test.expect(1);
    var filename = __dirname + '/fixtures/data/file3.md';
    petrify.readFile(filename, function(err, data){
        test.same(data, {
            key1: 'value1',
            key2: 'value2',
            body: '<h1>Test</h1>\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>'
        });
        test.done();
    });
};

exports.testReadData = function(test){
    test.expect(1);
    petrify.readData(__dirname + '/fixtures/data', function(err, data){
        test.same(data, {
            'file1.txt': {
                key1:'value1',
                key2:'value2',
                body:'some text\nsome more text'
            },
            'file2.html': {
                key1:'value1',
                key2:'value2',
                body:'<h1>Test</h1>'
            },
            'file3.md': {
                key1:'value1',
                key2:'value2',
                body:'<h1>Test</h1>\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>'
            }
        });
        test.done();
    });
};
