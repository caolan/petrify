var utils = require('../lib/utils');

exports['gsub'] = function (test) {
    test.expect(4);
    var fn = function (match) {
        test.equals(match, 'abc');
        return 'asdf';
    };
    var result = utils.gsub('123abcXYZ\nabc456abc', /ab(c)/, fn);
    test.equals(result, '123asdfXYZ\nasdf456asdf');
    test.done();
};

exports['gsub groups'] = function (test) {
    test.expect(4);
    var fn = function (match, group1, group2) {
        test.equals(match, 'abconetwo');
        test.equals(group1, 'one');
        test.equals(group2, 'two');
        return 'asdf' + group2;
    };
    var result = utils.gsub('abconetwo', /abc(one)(two)/, fn);
    test.equals(result, 'asdftwo');
    test.done();
};
