// wait until the navigation partial is complete
exports.requires = ['navigation'];


exports.run = function(view, context){

    // parse meta data - this updates the context.data in-place, so
    // other views can make use of these changes
    context.data = context.data.map(function(x){
        x.tags = x.metadata.tags.split(', ');
        x.date = new Date(x.metadata.date);
        x.url = x.filename.replace(/\.md$/, '.html');
        return x;
    });

    // for each article emit the article template
    context.data.forEach(function(article){
        var html = context.templates['article.jsont'].expand({
            article: article,
            partials: context.partials
        });
        view.emit(article.url, html);
    });

    view.done();
};
