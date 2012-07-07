var wmd = require('../lib/wmd'),
    underscores = wmd.preprocessors.underscores,
    metadata = wmd.preprocessors.metadata,
    yamlFrontMatter = wmd.preprocessors.yamlFrontMatter,
    fencedCodeBlocks = wmd.preprocessors.fencedCodeBlocks;


var mkTest = function (test, fn) {
    return function (input, expected) {
        var doc = {markdown: input};
        test.same(fn(doc), {markdown: expected});
    };
};

// underscore changes from github-flavored-markdown

exports['underscores'] = function (test) {
    var testOutput = mkTest(test, underscores);
    // not touch single underscores inside words
    testOutput('foo_bar', 'foo_bar');
    // not touch underscores in code blocks
    testOutput('    foo_bar', '    foo_bar');
    // not touch underscores in pre blocks
    testOutput('<pre>\nfoo_bar_baz\n</pre>', '<pre>\nfoo_bar_baz\n</pre>');
    // escape two or more underscores inside words
    testOutput("foo_bar_baz", "foo\\_bar\\_baz");
    test.done();
};

// Tests for newline changes in github-flavored-markdown:
/*
    // turn newlines into br tags in simple cases
    testOutput("foo  \nbar", "foo\nbar");
    // convert newlines in all groups
    testOutput(
        "apple\npear\norange\n\nruby\npython\nerlang",
        "apple  \npear  \norange\n\nruby  \npython  \nerlang"
    );
    // not convert newlines in lists
    testOutput("# foo\n# bar", "# foo\n# bar");
    testOutput("* foo\n* bar", "* foo\n* bar");
*/

exports['metadata'] = function (test) {
    test.same(
        metadata({
            markdown: 'property: value'
        }),
        {
            markdown: '',
            metadata: {property: 'value'}
        }
    );
    test.same(
        metadata({
            markdown: 'prop1: value1\n' +
                      'prop_two: value2\n' +
                      '\n' +
                      'markdown'
        }),
        {
            markdown: 'markdown',
            metadata: {prop1: 'value1', prop_two: 'value2'}
        }
    );
    test.same(
        metadata({
            markdown: 'prop1: value with spaces\n' +
                      'prop_two: value2\n' +
                      '          double-line\n' +
                      '   \n' +
                      '\n' +
                      'markdown'
        }),
        {
            markdown: 'markdown',
            metadata: {
                prop1: 'value with spaces',
                prop_two: 'value2\ndouble-line'
            }
        }
    );
    test.done();
};




exports['yamlFrontMatter'] = function (test) {
    test.same(
        yamlFrontMatter({
            markdown: '---\n' +
                      'property: value\n' +
                      '---'
        }),
        {
            markdown: '',
            metadata: {property: 'value'}
        }
    );
    test.same(
        yamlFrontMatter({
            markdown: '---\n' +
                      'prop1: value1\n' +
                      'prop_two: 2\n' +
                      '---\n' +
                      '\n' +
                      'markdown'
        }),
        {
            markdown: 'markdown',
            metadata: {prop1: 'value1', prop_two: 2}
        }
    );
    test.same(
        yamlFrontMatter({
            markdown: '---\n' +
                      'prop1: value with spaces\n' +
                      'list:\n' +
                      '    - item1\n' +
                      '    - item2\n' +
                      '---\n' +
                      '\n' +
                      '\n' +
                      '# markdown'
        }),
        {
            markdown: '# markdown',
            metadata: {
                prop1: 'value with spaces',
                list: ['item1', 'item2']
            }
        }
    );
    test.done();
};


exports['fencedCodeBlocks'] = function (test) {
    test.same(
        fencedCodeBlocks({
            markdown: 'foo\n\n```testlang\nbar\n```\n'
        }),
        {
            markdown: 'foo\n\n<pre><code class="testlang">bar\n</code></pre>\n'
        }
    );
    test.same(
        fencedCodeBlocks({
            markdown: 'foo\n\n```\nbar\n    baz\n```\n'
        }),
        {
            markdown: 'foo\n\n<pre><code class="no-highlight">' +
                'bar\n    baz\n</code></pre>\n'
        }
    );
    test.done();
};
