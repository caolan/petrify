Views
=====

Views are Javasript modules that export a run function:

    exports.run = function(view, context){
        view.done();
    };

This function receives a view argument which allows the view to emit files to
the output directory and a context argument which contains the data and
templates for the site. When a view is finished, it's important to call
view.done() so petrify can run other views which may depend on the current one.
You can declare if a view requires other views to be completed first by
exporting a requires property:

    exports.requires = ['navigation'];

This is especially useful for things like navigation, which will need to be
rendered so it can be included on other templates.


Context
-------

The context argument to a view's run function has the following properties:

* __data:__ An array of objects describing the files in the data directory.
  For more information on the structure of the objects contained in this array,
  see the data page in the docs.
* __templates:__ An object containing the compiled templates from the templates
  directory. The templates are keyed by filename
  (eg, context.templates['navigation.jsont']). For more information on using
  templates, see the template page in the docs.
* __partials:__ An object passed between views, used for storing data for later
  use. This could contain the rendered HTML for a navigation menu, or an array
  of processed data for convenience.

__Note:__ Context is passed to view functions as a reference, it is not copied
for each view. This means any changes to the context object will affect other
views. In the case of context.partials this is desired, in other cases it
might not be!


View
----

The view argument to a view's run function has the following methods:

* __emit(path, data):__ Saves data to a path in the output directory.
* __done():__ Tells petrify the view has finished processing data. When a view
  is finished, it's important to call view.done() so petrify can run other
  views which may depend on the current one. This is done as a callback instead
  of just returning from the view function to allow you to call async functions
  within the view.

__Note:__ When you call view.done(), the view does not actually complete until
all view.emit() calls have completed writing to the filesystem (this is done
async).
