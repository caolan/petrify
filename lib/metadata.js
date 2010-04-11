var fs = require('fs');


exports.parse = function(data){
    var metadata_str = data.split('\n\n')[0];
    var lines = metadata_str.split('\n');

    var result = {};
    var last_key;

    lines.forEach(function(x,i){
        var keymatch = /^([\w_-]+): /.exec(x);
        var datamatch = /^([\w_-]+:)? (.*)/.exec(x);
        if(keymatch){
            var key = keymatch.slice(1)[0];
            var data = datamatch.slice(2)[0].replace(/^\s+|\s+$/, '');
            last_key = key;
            result[key] = data;
        }
        else if(datamatch){
            var data = datamatch.slice(2)[0].replace(/^\s+|\s+$/, '');
            if(last_key){
                // strip whitespace:
                result[last_key] += '\n' + data;
            }
            else {
                throw new Error('Invalid metadata, line '+(i+1)+': "'+ x +'"');
            }
        }
        else {
            throw new Error('Invalid metadata, line '+(i+1)+': "'+ x +'"');
        }
    });

    return result;
};

exports.read = function(filename, callback){
    fs.readFile(filename, function(err, data){
        if(err) return callback(err, null);
        try {
            callback(null, exports.parse(data));
        }
        catch(e){
            callback(e, null);
        }
    });
};
