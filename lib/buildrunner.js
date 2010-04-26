// If this is run from the command-line:
if(module.id === '.'){
    require.paths.push(__dirname);
    require.paths.push(__dirname + '/../deps');
    require.paths.push(__dirname + '/../deps/json-template/lib');
    require.paths.push(__dirname + '/../deps/markdown-js/lib');
}


var petrify = require('petrify'),
    sys = require('sys');


var displayEvent = function(eventname){
    return function(name){
        sys.log(eventname + ': ' + name);
    };
};

var displayError = function(context_type){
    return function(err, context){
        sys.log(
            'ERROR in ' + context + ' ' + context_type + ': ' +
            (err.message || err.toString()) +
            (err.stack ? '\n' + err.stack : '')
        );
    };
};

exports.run = function(options){
    var runner = petrify.run(options);

    runner.data.addListener('load', displayEvent('load'));
    runner.templates.addListener('load', displayEvent('load'));
    runner.views.addListener('load', displayEvent('load'));
    runner.views.addListener('view_done', displayEvent('view_done'));

    runner.data.addListener('error', displayError('document'));
    runner.views.addListener('error',displayError('view'));
    runner.templates.addListener('error', displayError('template'));
    runner.addListener('error', displayError);

    runner.views.addListener('emit', function(view, path){
        sys.log('emit: ' + view + ' => ' + path);
    });

    runner.addListener('finished', function(err){
        if(err) sys.puts('Errors during build');
        else sys.puts('Done');
    });

    return runner;
};


// If this is run from the command-line:
if(module.id === '.'){

    var path = process.ARGV[2];
    require.paths.push(path);

    exports.run({
        data_dir: path + '/data',
        view_dir: path + '/views',
        template_dir: path + '/templates',
        output_dir: path + '/www',
    });
}
