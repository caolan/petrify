/**
 * Find each match of a regular expression in a string, apply a function to
 * each match and replace the matched string with the result of the function.
 *
 * @param {String} str
 * @param {RegExp} re
 * @param {Function} fn
 * @param {String} newstr
 * @api public
 */

exports.gsub = function (str, re, fn, /*optional*/newstr) {
    newstr = newstr || '';
    var match = re.exec(str);
    if (match) {
        newstr += str.slice(0, match.index);
        newstr += fn.apply(null, match);
        remaining = str.slice(match.index + match[0].length);
        return exports.gsub(remaining, re, fn, newstr);
    }
    return newstr + str;
};
