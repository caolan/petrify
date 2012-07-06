var gsub = require('./utils').gsub,
    yaml = require('js-yaml'),
    _ = require('underscore');


// github-flavored-markdown underscore changes

exports.underscores = function (doc) {
    // prevent foo_bar_baz from ending up with an italic word in the middle
    doc.markdown = gsub(doc.markdown,
        /(^(?! {4}|\t)\w+_\w+_\w[\w_]*)/, function (match) {
            var count = 0;
            for (var i = 0; i < match.length; i++) {
                if (match[i] == '_') count++;
            }
            if (count === 2) {
                return match.replace(/_/g, '\\_');
            }
            return match;
        }
    );
    return doc;
};

// github-flavored-markdown newline changes - currently BROKEN

// in very clear cases, let newlines become <br /> tags
/*doc.markdown = gsub(doc.markdown,
    /(\A|^$\n)(^\w[^\n]*\n)(^\w[^\n]*$)+/m, function (match, group1) {
        return match.replace(/^(.+)$/, group1 + '  ');
    }
);*/

exports.metadata = function (doc) {
    var key;
    var lines = doc.markdown.split('\n');
    doc.metadata = {};

    while (lines.length) {
        var match = /^(\S+):\s+(.*)$/.exec(lines[0]);
        if (match) {
            var key = match[1];
            doc.metadata[key] = match[2];
            lines.shift();
        }
        else {
            var continued_value = /^\s+(.+)$/.exec(lines[0]);
            // strip empty lines
            if (/^\s*$/.exec(lines[0])) {
                lines.shift();
            }
            else if (continued_value && key) {
                doc.metadata[key] += '\n' + continued_value[1];
                lines.shift();
            }
            else break;
        }
    }
    doc.markdown = lines.join('\n');
    return doc;
};


/**
 * Parses Jekyll-style YAML front matter (similar to metadata parser above)
 */

exports.yamlFrontMatter = function (doc) {
    var m = /^---\n([\s\S]*)---\n*/.exec(doc.markdown);
    if (m) {
        doc.metadata = {};
        doc.metadata = _.extend(doc.metadata, yaml.load(m[1]));
        doc.markdown = doc.markdown.substr(m[0].length);
    }
    return doc;
};
