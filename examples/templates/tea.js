exports.builds = {
    assets: {
        // copy all static assets to build directory
        "include": {paths: ["css", "img", "js"]}
    },
    templates: {
        // load templates then render index.html
        "handlebars-load": {path: "templates"},
        "handlebars-render": {templates: ["*"]}
    },
    all: [
        // run assets and templates build steps in parallel
        "@assets",
        "@templates"
    ]
};
