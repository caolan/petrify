var metadata = require('metadata');


exports.testParse = function(test){
    test.same(metadata.parse("key1: some data"), {key1: 'some data'});
    test.same(metadata.parse("key1: some data\n\nblah"), {key1: 'some data'});
    test.done();
};

exports.testParseMultiline = function(test){
    test.same(
        metadata.parse("key1: some data\n more data"),
        {key1: 'some data\nmore data'}
    );
    // trailing whitespace:
    test.same(
        metadata.parse("key1: some data\n more data   "),
        {key1: 'some data\nmore data'}
    );
    test.done();
};

exports.testParseMultipleKeys = function(test){
    test.same(
        metadata.parse("key1: data1\nkey2: data2\n\nblah blah blah"),
        {key1: 'data1', key2: 'data2'}
    );
    test.same(
        metadata.parse("key1: line1\n      line2\nkey2: data2\n\nblah"),
        {key1: 'line1\nline2', key2: 'data2'}
    );
    test.done();
};

exports.testInvalid = function(test){
    test.expect(2);
    try {
        metadata.parse('blah blah blah');
    }
    catch(e){
        test.ok(true);
    }
    try {
        metadata.parse(' blah blah blah');
    }
    catch(e){
        test.ok(true);
    }
    test.done();
};
