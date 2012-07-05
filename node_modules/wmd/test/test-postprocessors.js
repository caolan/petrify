var wmd = require('../lib/wmd'),
    jsdom = wmd.postprocessors.jsdom,
    first_paragraph = wmd.postprocessors.first_paragraph,
    heading = wmd.postprocessors.heading,
    html_no_heading = wmd.postprocessors.html_no_heading;


function createDoc() {
    return {
        html: '<h1>title text</h1>' +
              '<p>first paragraph</p>' +
              '<p>second paragrapg</p>'
    };
}

exports['jsdom'] = function (test) {
    var doc = createDoc();
    var doc2 = jsdom(doc);
    test.equal(doc2.html, doc.html);
    test.equal(doc2.window.document.innerHTML, doc.html);
    test.equal(
        doc2.window.document.getElementsByTagName("H1")[0].innerHTML,
        'title text'
    );
    test.done();
};

exports['first_paragraph'] = function (test) {
    var doc = createDoc();
    var doc2 = first_paragraph(doc);
    test.equal(doc2.first_paragraph, 'first paragraph');
    test.done();
};

exports['first_paragraph without p tags'] = function (test) {
    var doc = {html: '<h1>test</h1>'};
    var doc2 = first_paragraph(doc);
    test.equal(doc2.first_paragraph, null);
    test.done();
};

exports['heading'] = function (test) {
    var doc = createDoc();
    var doc2 = heading(doc);
    test.equal(doc2.heading, 'title text');
    test.done();
};

exports['heading without h1 tag'] = function (test) {
    var doc = {html: '<p>test</p>'};
    var doc2 = heading(doc);
    test.equal(doc2.heading, null);
    test.done();
};

exports['html_no_heading'] = function (test) {
    var doc = createDoc();
    var doc2 = html_no_heading(doc);
    test.equal(
        doc2.html_no_heading,
        '<p>first paragraph</p><p>second paragrapg</p>'
    );
    test.done();
};

exports['html_no_heading without h1 tag'] = function (test) {
    var doc = {html: '<p>test</p>'};
    var doc2 = html_no_heading(doc);
    test.equal(doc2.html_no_heading, '<p>test</p>');
    test.done();
};
