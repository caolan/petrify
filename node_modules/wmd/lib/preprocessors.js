var gsub = require('./utils').gsub,
    yaml = require('js-yaml'),
    hljs = require('highlight.js'),
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

/**
 * Used to escape HTML inside fenced code blocks
 */

function escapeHtml(s) {
    s = ('' + s); /* Coerce to string */
    s = s.replace(/&/g, '&amp;');
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = s.replace(/"/g, '&quot;');
    s = s.replace(/'/g, '&#39;');
    return s;
};

/**
 * Process GitHub style fenced code blocks
 */

exports.fencedCodeBlocks = function (doc) {
    var re1 = /```([A-Za-z]+)\s*([\s\S]+?)```/; // with syntax highlighting
    var re2 = /```\s*([\s\S]+?)```/; // without syntax highlighting
    var block;
    while (block = re1.exec(doc.markdown) || re2.exec(doc.markdown)) {
        var pre;
        if (block.length === 3) {
            // we have a code format
            pre = '<pre><code class="' + escapeHtml(block[1]) + '">' +
                escapeHtml(block[2]) + '</code></pre>';
        }
        else {
            // no syntax highlighting
            pre = '<pre><code class="no-highlight">' +
                escapeHtml(block[1]) + '</code></pre>';
        }
        doc.markdown = doc.markdown.substr(0, block.index) +
            pre + doc.markdown.substr(block.index + block[0].length);
    }
    return doc;
};

/**
 * Process GitHub style fenced code blocks, with highlight.js
 * preprocessing to embed html tags for syntax highlighting.
 */

exports.fencedCodeBlocksHighlightJS = function (doc) {
    var re1 = /```([A-Za-z]+)\s*([\s\S]+?)```/; // with syntax highlighting
    var re2 = /```\s*([\s\S]+?)```/; // without syntax highlighting
    var block;
    while (block = re1.exec(doc.markdown) || re2.exec(doc.markdown)) {
        var pre;
        if (block.length === 3) {
            // we have a code format
            pre = '<pre><code class="' + escapeHtml(block[1]) + '">';
            if (block[1] in hljs.LANGUAGES) {
                pre += hljs.highlight(block[1], block[2]).value;
            }
            else {
                pre += escapeHtml(block[2]);
            }
            pre += '</code></pre>';
        }
        else {
            // no syntax highlighting
            pre = '<pre><code class="no-highlight">' +
                escapeHtml(block[1]) + '</code></pre>';
        }
        doc.markdown = doc.markdown.substr(0, block.index) +
            pre + doc.markdown.substr(block.index + block[0].length);
    }
    return doc;
};
