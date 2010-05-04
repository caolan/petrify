Templates
=========

The template directory can contain
[JSON-Template](http://json-template.googlecode.com/svn/trunk/doc/Introducing-JSON-Template.html)
files (with the extension .jsont), all other file formats are currently
ignored. Also, only files in the top level of the data directory are loaded,
subdirectories are not supported at this time.


JSON-Template syntax
--------------------

[JSON-Template](http://json-template.googlecode.com/svn/trunk/doc/Introducing-JSON-Template.html)
is a minimal, declarative (rather than procedural) templating
language. Because the language is deliberately small, it is quick to pick up.
It also comes with a default set of "formatters", so it's easy to get
escaping/security right. Although, having a static site mitigates many security
risks.

From the JSON-Template author:

> "The syntax is an "upgrade" of Python 3 syntax. Often I use Python's string
> formatting for simple web apps, since it offers simple named variable
> substitution."

The [JSON-Template reference](http://code.google.com/p/json-template/wiki/Reference)
can be found on the project's Google code site, along with some
[examples](http://code.google.com/p/json-template/wiki/JsonTemplateExamples).


Template objects
----------------

When building a site, Petrify makes the templates available as objects in
context.templates, which can be referenced by filename
(eg, context.templates['mytemplate.jsont']). Each object has an expand method:

* __expand(data):__ Renders the template using the data object passed to the
  expand() method. Returns the resulting string.
