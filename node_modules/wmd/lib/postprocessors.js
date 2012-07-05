exports.jsdom = function (doc) {
    var jsdom = require('jsdom').jsdom,
        htmlparser = require('htmlparser');

    doc.window = jsdom(doc.html, jsdom.defaultLevel, {
        parser: htmlparser
    }).createWindow();
    return doc;
};

exports.first_paragraph = function (doc) {
    if (!doc.window) doc = exports.jsdom(doc);
    var tags = doc.window.document.getElementsByTagName("P");
    doc.first_paragraph = tags.length ? tags[0].innerHTML: null;
    return doc;
};

exports.heading = function (doc) {
    if (!doc.window) doc = exports.jsdom(doc);
    var tags = doc.window.document.getElementsByTagName("H1");
    doc.heading = tags.length ? tags[0].innerHTML: null;
    return doc;
};

exports.html_no_heading = function (doc) {
    var jsdom = require('jsdom').jsdom,
        htmlparser = require('htmlparser');

    // create new window because we'll be editing the html
    var window = jsdom(doc.html, jsdom.defaultLevel, {
        parser: htmlparser
    }).createWindow();
    var tags = window.document.getElementsByTagName("H1");
    if (tags.length) {
        var elem = tags[0];
        elem.parentNode.removeChild( elem );
        doc.html_no_heading = window.document.innerHTML;
    }
    else doc.html_no_heading = doc.html;
    return doc;
};
