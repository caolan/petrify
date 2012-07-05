var _ = require('underscore');


module.exports = function (context, emit, callback) {
    var blogposts = context.data.filter(function (d) {
        return d.type === 'blogpost';
    });
    var tmpl = context.handlebars['home.html'];
    emit('index.html', tmpl({
        blogposts: _.sortBy(blogposts, function (b) {
            return b.pubdate;
        }).reverse()
    }));
    callback();
};
