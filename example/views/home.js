
require.paths.push('/slotsghp-blog/petrify/lib');
var html_escape = require("petrify").html_escape;

// wait until the navigation and articles views are complete
exports.requires = ['navigation', 'articles'];

//function html_escape(s) { 
//    return s.split('&').join('&amp;').split( '<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); 
//	}

exports.run = function(view, context){

    var sorted_articles = context.data.sort(function(a, b) {
		    return b.date - a.date;
	});

    // render the home template
    var html = context.templates['home.jsont'].expand({
	    articles: sorted_articles,
	    partials: context.partials
    });

    // prepare xml for feed by rendering each article in xml
    var articles_xml = [];
    sorted_articles.forEach(function(value,index,array) {
	    value.escaped_html_no_heading = html_escape(value.html_no_heading);

	    var article_xml = context.templates['article_xml.jsont'].expand({
		    article: value,
		    partials: {}
		});
	    articles_xml.push(article_xml);
	});

    // render the xml feed
    var feed_xml = context.templates['home_xml.jsont'].expand({
	    articles_xml:articles_xml,
	    updated:"test",
	    partials: {}
	});

    view.emit('index.html', html);
    view.emit('atom.xml', feed_xml);

};
