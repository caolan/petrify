# Tea

A flexible build tool and static site generator for JavaScript.

To use Tea, there are only two parts you need to understand: __tea.js__
files and __tasks__. With these simple components you can do anything your
project needs. Tea also includes some __built-in tasks__ to get your
project off the ground and cover the basics.


## Docs

* [Installation](#installation)
* [Commands](#commands)
* [Tea.js](#tea.js)
* [Tasks](#tasks)
* [Built-in tasks](#built-in_tasks)
  * [include](#include) - copies files and directories to build directory
  * [data-load](#data-load) - loads markdown, json and yaml files into
  * [handlebars-load](#handlebars-load) - read and compile handlebars
    templates


<a id="installation" />
## Installation

    sudo npm install -g teajs


<a id="commands" />
## Commands

Use `tea -h` to see usage info on commands, but here's a brief overview:

* __build [TARGET]__ - When run in a directory with a `tea.js` file it will
  run the build steps in the TARGET build. If TARGET is not specified it
  will run the "all" build.
* __--watch__ - the watch option will automatically re-run the build any
  time a file inside the project directory changes
* __--server__ - starts a HTTP server with the newly generated build as the
  root directory, can be combined with --watch to provide an instant
  preview of the site. You can also set the --port and --hostname options.
* __-o OUTPUT_DIR__ - override the output directory, defaults to
  `./build/TARGET`

<a id="tea.js" />
## Tea.js

The `tea.js` file tells Tea how to build your project. You can define
multiple builds, meaning you can have different rules for development,
production and testing. You could also create different 'flavours' of your
project by including or excluding various components in alternate builds.

This file is a [Node.js](http://nodejs.org) module.

```javascript
exports.tasks = {
    blogposts: "./tasks/blogposts",
    home: "./tasks/home"
};

exports.builds = {
    all: {
        "include": {paths: ["css", "img", "js"]},
        "data-load": {path: "data"},
        "handlebars-load": {path: "templates"},
        "blogposts": null,
        "home": null
    }
};
```

The __tasks__ property tells Tea where to find tasks that are not built-in.
Here, we define two custom tasks `blogposts` and `home`. We'll talk more
about defining tasks later. Until then, just understand that tasks are
build steps you can use in your builds section. Each task is just a Node.js
module.

The __builds__ property tells Tea how to build your project. You can define
multiple build names, the default build is "all" (like Makefiles). Here, we
have only defined the default build. When you do `tea build`, each of the
tasks listed under `builds.all` will be run in order. The values of each
property in the build definition are passed to the task module. For
example, the "data-load" task is passed the config `{path: "data"}`.

#### Parallel tasks

You can also run tasks in __parallel__. To do this, just prefix the task
name with '@' in the build definition:

```javascript
exports.builds = {
    all: {
        "@include": {paths: ["css", "img", "js"]},
        "@data-load": {path: "data"},
        "@handlebars-load": {path: "templates"},
        "blogposts": null,
        "home": null
    }
};
```

Now, we run the "include", "data-load" and "handlebars-load" tasks in
parallel. Then, once they have all completed, we run the "blogposts" task,
followed by the "home" task.

__A task name starting with '@' will start at the same time as the previous
task. A task name without an '@' symbol will wait for all previous tasks to
finish.__

#### Builds that run builds

```javascript
exports.builds = {
    assets: {
        "include": {paths: ["css", "img", "js"]}
    },
    load: {
        "@data-load": {path: "data"},
        "@handlebars-load": {path: "templates"}
    },
    pages: ["load", {
        "@blogposts": null,
        "@home": null
    }],
    all: ["@assets", "@pages"]
};
```

Here is a much more complicated example, that is split up into separate
build definitions. The "all" build now runs the "assets" and "pages" builds
in parallel. The "pages" build then runs the "load" build before running
the `blogposts` and `home` tasks.

The actual execution order of tasks when building "all" will now look
something like this:


```
[- include -------------------------]
[- data-load --------------]
[- handlebars-load -]
                            [- blogposts ---------]
                            [- home -------]

[= TOTAL TIME ====================================]
```


<a id="tasks" />
## Tasks

Tasks are just Node.js modules that export a single function. Here is an
example "blogposts" task that renders blogpost data using a handlebars
template.

```javascript
module.exports = function (tea, context, config, callback) {
    
    // filter the data to get all the blogposts
    var blogposts = context.data.filter(function (d) {
        return d.type === 'blogpost';
    });

    // use the blogpost.html template
    var tmpl = context.handlebars['blogpost.html'];

    // create a html file for each blogpost
    blogposts.forEach(function (b) {
        tea.emit('posts/' + b.slug + '/index.html', tmpl(b));
    });

    // finish the task
    callback();

};
```

The task function accepts four arguments:

* __tea__ - the tea object, contains some utility functions and useful info
  * __source__ - _String_ - the project directory path
  * __target__ - _String_ - the output directory for the build
  * __info(msg)__ - output info to tea logs
  * __warn(msg)__ - output warnings to tea log
  * __error(msg)__ - output errors to tea log
  * __debug(msg)__ - output debug info to tea log
  * __emit(filename, content)__ - creates a new file with the provided
    content. Filename is relative to the build directory
* __context__ - a shared, global context object. Every task shares this
  object and it can be used to pass values on to subsequent tasks. Eg, the
  "data-load" task adds a `data` property to the context object which we
  use in the "blogposts" task example.
* __config__ - This contains the config value passed to the task from the
  build step in `tea.js`. For example, using the previous `tea.js` example
  files, the task "data-load" would have the config argument set to
  `{path:"data"}`.
* __callback__ - a function you __must__ call when the task is complete.
  This let's Tea know it can move on to the next task. You can also pass an
  error as the first argument to indicate a task failure.


<a id="built-in_tasks" />
## Built-in Tasks

To help you get started with a static site, a number of useful task modules
have been included. You can use these without defining them in the "tasks"
property in `tea.js`.


<a id="include" />
### include

Recursively copies files and directories from the project directory to the
build directory. This is commonly used to include static files that don't
need to be generated, eg "css", "img", "vendor", etc.

#### Config Options

* __paths__ - An array of paths strings, relative to the project directory.


<a id="data-load" />
### data-load

This task will read all supported files inside a directory and add them to
the "data" property of the global context. Once loaded, these files can be
accessed by other tasks throught the context object as an array of Objects:

```javascript
context.data = [
    {
        __filename: 'data/foo.json',
        __format: 'json',
        __raw: '{"foo": "bar", "example": true},
        foo: 'bar',
        example: true
    },
    {
        __filename: 'data/bar.yaml',
        __format: 'yaml',
        __raw: '{"bar": "baz"},
        bar: 'baz'
    },
    {
        __filename: 'data/baz.md',
        __format: 'markdown',
        __raw: '---\nfoo: bar\n---\n\n# Title\n\nParagraph one',
        foo: 'bar',
        markdown: '# Title\n\nParagraph one',
        html: '<h1>Title</h1><p>Paragraph one</p>'
    }
];
```

#### Config Options

* __path__ - _String_ - the path to the data directory to load

#### Markdown (.md, .markdown)

This handles GitHub-style fenced code blocks (and can even pre-highlight
them using [highlight.js](http://softwaremaniacs.org/soft/highlight/en/))
and lets you add Jekyll-style [YAML](yaml.org) front matter to your
Markdown files, for example: 
```
---
type: blogpost
pubdate: 2012-07-09T14:32:00Z
---

# Title

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
est laborum.
```

#### YAML (.yaml)

Example from [wikipedia](http://en.wikipedia.org/wiki/YAML#Examples):

```yaml
receipt:     Oz-Ware Purchase Invoice
date:        2007-08-06
customer:
    given:   Dorothy
    family:  Gale

items:
    - part_no:   A4786
      descrip:   Water Bucket (Filled)
      price:     1.47
      quantity:  4

    - part_no:   E1628
      descrip:   High Heeled "Ruby" Slippers
      size:      8
      price:     100.27
      quantity:  1

bill-to:  &id001
    street: |
            123 Tornado Alley
            Suite 16
    city:   East Centerville
    state:  KS

ship-to:  *id001

specialDelivery:  >
    Follow the Yellow Brick
    Road to the Emerald City.
    Pay no attention to the
    man behind the curtain.
```


#### JSON (.json)

Example from [Wikipedia](http://en.wikipedia.org/wiki/JSON):

```javascript
{
    "firstName": "John",
    "lastName": "Smith",
    "age": 25,
    "address": {
        "streetAddress": "21 2nd Street",
        "city": "New York",
        "state": "NY",
        "postalCode": "10021"
    },
    "phoneNumber": [
        {
          "type": "home",
          "number": "212 555-1234"
        },
        {
          "type": "fax",
          "number": "646 555-4567"
        }
    ]
}
```

<a id="handlebars-load" />
### handlebars-load

Loads and compiles [handlebars](http://handlebarsjs.com) templates and adds them
to the global context object for use by other tasks.

#### Config Options

* __path__ - the path to the templates directory

#### Example

```
project/
    templates/
        foo.html
        bar.html
    ...
```

__tea.js__
```javascript
    ...
    "handlebars-load": {path: "templates"}
    ...
```

__task module__
```javascript
module.exports = function (tea, context, config, callback) {
    ...
    var html = context.handlebars['foo.html']({
        some: 'values',
        count: 123
    });
    ...
};
```
