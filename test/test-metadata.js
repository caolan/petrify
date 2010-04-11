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

exports.testRead = function(test){
    test.expect(2);
    var parse_copy = metadata.parse;
    metadata.parse = function(data){
        test.equals(data, 'some data\n');
        return 'metadata';
    };
    var filename = __dirname + '/fixtures/metadata_file';
    metadata.read(filename, function(err, data){
        test.same(data, 'metadata');
        metadata.parse = parse_copy;
        test.done();
    });
};

exports.testReadNoFile = function(test){
    test.expect(1);
    var parse_copy = metadata.parse;
    metadata.parse = function(data){
        test.ok(false, 'should not be called');
    };
    var filename = __dirname + '/fixtures/doesnotexist';
    metadata.read(filename, function(err, data){
        test.ok(err instanceof Error, 'read returns fs error');
        metadata.parse = parse_copy;
        test.done();
    });
};

exports.testReadParseError = function(test){
    test.expect(1);
    var parse_copy = metadata.parse;
    var e = new Error('test');
    metadata.parse = function(data){
        throw e;
    };
    var filename = __dirname + '/fixtures/metadata_file';
    metadata.read(filename, function(err, data){
        test.equals(err, e, 'read returns parse error');
        metadata.parse = parse_copy;
        test.done();
    });
};
