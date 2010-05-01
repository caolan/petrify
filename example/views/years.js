// wait until the navigation and articles views are complete
exports.requires = ['navigation', 'articles'];


exports.run = function(view, context){

    // use the list of unique years generated in the naviagtion view
    context.partials.years.forEach(function(year){

        // get the articles in that year
        var articles = context.data.filter(function(d){
            return d.date.getFullYear() == year;
        });

        // render the year template
        var html = context.templates['year.jsont'].expand({
            name: year,
            articles: articles,
            partials: context.partials
        });

        view.emit(year + '.html', html);

    });

};
