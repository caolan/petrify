var petrify = require('petrify');


exports.testReadFileMarkdown = function(test){
    test.expect(1);
    var filename = __dirname + '/fixtures/data/file1.md';
    petrify.readFile(filename, function(err, data){
        test.same(data, {
            filename: 'file1.md',
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
        test.same(data, [
            {
                filename:'file2.md',
                key:'value',
                body:'<h1>Test 2</h1>'
            },
            {
                filename: 'file1.md',
                key1:'value1',
                key2:'value2',
                body:'<h1>Test</h1>\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>'
            }
        ]);
        test.done();
    });
};
