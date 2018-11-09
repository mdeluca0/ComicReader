const assert = require('assert');
const strManip = require('../src/str-manip');

describe('strManip', function() {
    describe('#replaceEscapedCharacters()', function() {
        it('should replace &47; with /', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &47; &47;'), 'Word / /');
        });
        it('should replace &92; with \\', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &92;'), 'Word \\');
        });
        it('should replace &58; with :', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &58;'), 'Word :');
        });
        it('should replace &42; with *', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &42;'), 'Word *');
        });
        it('should replace &63; with ?', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &63;'), 'Word ?');
        });
        it('should replace &34; with "', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &34;'), 'Word "');
        });
        it('should replace &60; with <', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &60;'), 'Word <');
        });
        it('should replace &lt; with <', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &lt;'), 'Word <');
        });
        it('should replace &62; with >', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &62;'), 'Word >');
        });
        it('should replace &gt; with >', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &gt;'), 'Word >');
        });
        it('should replace &124; with |', function() {
            assert.equal(strManip.replaceEscapedCharacters('Word &124;'), 'Word |');
        });
    });
    describe('#removeHtmlTags()', function() {
        it('remove all tags except p tags', function() {
            assert.equal(strManip.removeHtmlTags('<p><span/>qwdqwdqwdq</p>'), '<p>qwdqwdqwdq</p>');
            assert.equal(strManip.removeHtmlTags('<p>qwdqwdqwdq</p>'), '<p>qwdqwdqwdq</p>');
            assert.equal(strManip.removeHtmlTags('<div>qwdqwdqwdq</div>'), 'qwdqwdqwdq');
        });
    });
    describe('#removeLeadingZeroes()', function() {
        it('remove leading zeroes', function() {
            assert.equal(strManip.removeLeadingZeroes('006'), '6');
            assert.equal(strManip.removeLeadingZeroes('6AU'), '6AU');
            assert.equal(strManip.removeLeadingZeroes('6AU.0'), '6AU.0');
            assert.equal(strManip.removeLeadingZeroes('100'), '100');
            assert.equal(strManip.removeLeadingZeroes('201'), '201');
            assert.equal(strManip.removeLeadingZeroes('1000.1'), '1000.1');
        });
    });
});