module.exports = function (context, emit, callback) {
    var blogposts = context.data.filter(function (d) {
        return d.type === 'blogpost';
    });
    var tmpl = context.handlebars['blogpost.html'];
    blogposts.forEach(function (b) {
        emit('posts/' + b.slug + '/index.html', tmpl(b));
    });
    callback();
};
