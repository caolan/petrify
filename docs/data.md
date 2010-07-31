Data
====

The data directory can contain
[Markdown](http://daringfireball.net/projects/markdown/) files (with the
extension .md), all other file formats are currently ignored. Also, only files
in the top level of the data directory are loaded, subdirectories are not
supported at this time.


Markdown syntax
---------------

[Markdown](http://daringfireball.net/projects/markdown/) is an easy to write,
easy to read markup language inspired by the way people write in plain text
emails. The
[Markdown syntax](http://daringfireball.net/projects/markdown/syntax)
is really simple to pick up, and quicker to write than HTML!

Petrify uses the [Maruku](http://maruku.rubyforge.org) dialect of Markdown.
This includes the original Markdown syntax plus the improvements in
[PHP Markdown Extra](http://michelf.com/projects/php-markdown/extra/) and a
[new meta-data syntax](http://maruku.rubyforge.org/proposal.html).

It's also possible to add properties at the top of a Markdown file:

    type: Article
    date: Sat, 11 Jul 2009 18:43:50 +0100
    tags: monkeys, penguins

    # Article One

    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua.

The date, type and tags properties in the above example are then made
available to view functions. This is very useful when you want to
differentiate between types of document (eg, news, event, article...).


Data objects
------------

When building a site, Petrify makes the content of these markdown files
available to view functions as an array of objects in context.data. Each
object has the following properties:

* __filename:__ The basename of the source markdown file. This does not include
  the path of the data directory, just the name of the file itself.
* __meta:__ An object representing the properties at the top of the document
  (date, type and tag from the above example in the _Markdown syntax_ section).
* __jsonml:__ An intermediate representation in [JSONML](http://jsonml.org/)
  to allow processing of parsed data.
* __html:__ The HTML representation of the Markdown data (not including the
  html/head/body tags etc).
* __heading:__ The text of the first level-1 (H1) heading. Useful for setting
  the page title etc.
* __html_no_heading:__ The HTML representation of the Markdown data with the
  first level-1 (H1) heading removed.
* __first_paragraph:__ The HTML representation of the first paragraph.
