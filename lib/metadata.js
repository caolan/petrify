exports.parse = function(data){
    var metadata_str = data.split('\n\n')[0];
    var lines = metadata_str.split('\n');

    var result = {};
    var last_key;

    for(var i=0; i<lines.length; i++){
        var keymatch = /^([\w_-]+): /.exec(lines[i]);
        var datamatch = /^([\w_-]+:)? (.*)/.exec(lines[i]);
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
                throw new Error(
                    'Invalid metadata, line ' + i + ': "' + lines[i] + '"'
                );
            }
        }
        else {
            throw new Error(
                'Invalid metadata, line ' + i + ': "' + lines[i] + '"'
            );
        }
    }

    return result;
};
