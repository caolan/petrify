exports.tasks = {
    'blogposts': './tasks/blogposts',
    'home': './tasks/home'
};

exports.builds = {
    load: {
        "@data-load": {path: "data"},
        "@handlebars-load": {path: "templates"}
    },
    render: {
        '@blogposts': null,
        '@home': null
    },
    all: ['load', 'render']
};
