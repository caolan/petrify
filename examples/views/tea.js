exports.builds = {
    all: {
        // load templates and data, then render views
        "@data-load": {path: "data"},
        "@handlebars-load": {path: "templates"},
        "views-render": {views: [
            "views/blogposts.js",
            "views/home.js"
        ]}
    }
};
