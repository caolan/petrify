# WMD

A Markdown parser for CommonJS (and node.js) based on the excellent
[Showdown](http://attacklab.net/showdown/).

Essentially WMD, is just a wrapper around Showdown, with a few hooks for
preprocessing, and some default preprocessors and postprocessors.


## Example

    var wmd = require('wmd');

    var html = wmd('Markdown *rocks*.');
    console.log(html);


# Documentation


## wmd(markdown, options)

* __markdown__ - A string containing Markdown.
* __options__ - (optional) An object containing options (see options section)

The main function for converting Markdown to HTML, and normally the only
function you'll need ot use. Applies all preprocessors defined in options
before passing the result to Showdown for the final rendering.

By default, the underscores and metadata preprocessors are used.

This function returns a __doc__ object. The contents of the doc object may
differ depending on the preprocessors used, but will always contain the
following:

* __doc.html__ - The final HTML output of the conversion.
* __doc.markdown__ - The markdown text passed to the processsor after all
  preprocesor functions have been applied.
* __doc.raw__ - The raw string before preprocessors were applied.

The string representation of a doc object (doc.toString()) is the same as
doc.html.


## wmd.preprocessors

An object containing core preprocessor functions:

* __underscores__ - code-friendly underscore processing taken from GitHub
  Flavored Markdown. This means the bar in foo\_bar\_baz does not get emphasis.
* __fencedCodeBlocks__ - GitHub style fenced code blocks
* __yamlFrontMatter__ - Jekyll style YAML front matter for metadata
* __metadata__ - takes metatdata information from the top of a markdown file
  and adds it to doc.metadata.

      property1: some value
      property2: multi
                 line
                 value

      # Markdown goes here

  Would result in the following doc object:

      {
          metadata: {
              property1: "some value",
              property2: "multi\nline\nvalue"
          },
          html: "<h1>Markdown goes here</h1>",
          markdown: "# Markdown goes here",
          raw: "property1: some value\nproperty2: multi\nline\nvalue\n\n# Markdown goes here"
      }

Adding preprocessors to wmd:

    var wmd = require('wmd');
    var html = wmd('Markdown *rocks*.', {
        preprocessors: [
            function (doc) {
                doc.markdown += '.. even more!';
                return doc;
            }
        ]
    });

By default, the underscores and metadata preprocessors will be used.

## wmd.postprocessors

An object containing core postprocessor functions:

* __jsdom__ - uses jsdom to add doc.window containing the HTML generated from
  markdown
* __first_para__ - adds doc.first_para containing the text in the first p tag
* __heading__ - adds doc.heading containing the text in the first h1 tag

Adding postprocessors to wmd:

    var wmd = require('wmd');
    var html = wmd('Markdown *rocks*.', {
        postprocessors: [
            function (doc) {
                doc.html += '<b>more html stuff</b>';
                return doc;
            }
        ]
    });

By default, no postprocessors will be used.


## wmd.processor(markdown)

* __markdown__ - A string containing Markdown.

The function which performs the conversion from markdown to html. By default
this is just Showdown's makeHTML function.


## wmd.preprocess(doc, options)

* __doc__ - A doc object
* __options__ - (optional) An object containing options (see options section)

Applies the preprocessor functions defined in options to the doc (usually
updating doc.markdown, sometimes adding new properties) before the doc is
passed to the processor.


## wmd.postprocess(doc, options)

* __doc__ - A doc object
* __options__ - (optional) An object containing options (see options section)

Applies the postprocessor functions defined in options to the doc.


## wmd.readOptions(options)

* __options__ - (optional) An object containing options (see options section)

You would not normally need to call this directly. This function adds default
options to those passed to the main wmd function.


## Options

* __preprocessors__ - An array of functions which can transform the document
  before its passed to the processor function. By default the underscores and
  metadata preprocessors are used.
* __postprocessors__ - An array of functions which can transform the document
  after its been passed to the processor function. By default, no
  postprocessors are used.
