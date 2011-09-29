// wait until the navigation and articles views are complete
exports.requires = ['navigation', 'articles'];


exports.run = function(view, context){

    // use the list of unique tags generated in the naviagtion view
    context.partials.tags.forEach(function(tag){

        // get the articles with the tag
        var articles = context.data.filter(function(d){
            return d.tags.some(function(t){return t === tag;});
        });

        // render the tag template
        var html = context.templates['tag.jsont'].expand({
            name: tag,
            articles: articles,
            partials: context.partials
        });

        view.emit(tag + '.html', html);

    });

    view.done();
};
