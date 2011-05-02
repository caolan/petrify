
// wait until the navigation partial is complete
exports.requires = ['navigation'];


// date helpers to allow for nicer date formatting
var DOW = {0:"Sunday",
       1:"Monday",
       2:"Tuesday",
       3:"Wednesday",
       4:"Thursday",
       5:"Friday",
       6:"Saturday"
};

var MOY = {0:"Jan",
	   1:"Feb",
	   2:"Mar",
	   3:"Apr",
	   4:"May",
	   5:"Jun",
	   6:"Jul",
	   7:"Aug",
	   8:"Sep",
	   9:"Oct",
	   10:"Nov",
	   11:"Dec"};

function html_escape(s) {
    return s.split('&').join('&amp;').split( '<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
}
   
    exports.run = function(view, context){

    // parse meta data - this updates the context.data in-place, so
    // other views can make use of these changes
    context.data = context.data.map(function(x){
        x.tags = x.metadata.tags.split(', ');
        x.date = new Date(x.metadata.date);
	x.weekday = DOW[x.date.getUTCDay()];
	x.month = MOY[x.date.getUTCMonth()];
	x.day = x.date.getUTCDate();
	x.year = x.date.getUTCFullYear();
        x.url = x.filename.replace(/\.md$/, '.html');
	x.xmlurl = x.filename.replace(/\.md$/, '.xml');
        return x;
    });

    // for each article emit the article template
    context.data.forEach(function(article){

	// generate html article
        var html = context.templates['article.jsont'].expand({
            article: article,
            partials: context.partials
        });
	article.escaped_html_no_heading = html_escape(article.html_no_heading);

	// generate xml article for atom feed
        var xml = context.templates['article_xml.jsont'].expand({
            article: article,
            partials: context.partials
        });

        view.emit(article.url, html);

	// xml headers prepended manually - a bit of a hack to allow the article templates to be embedded into the overall atom.xml feed
        view.emit(article.xmlurl, '<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/css" media="screen" href="http://feeds.feedburner.com/~d/styles/itemcontent.css"?>' + xml);

    });

    view.done();
};
