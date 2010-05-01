// wait until the navigation and articles views are complete
exports.requires = ['navigation', 'articles'];


exports.run = function(view, context){

    // render the home template
    var html = context.templates['home.jsont'].expand({
        articles: context.data,
        partials: context.partials
    });

    view.emit('index.html', html);

};
