const assert = require('assert');
const consts = require('../src/consts');

describe('consts', function() {
    describe('#convertToThreeDigits()', function() {
        it('should return a 3 digit number from a number less than 1000', function() {
            assert.equal(consts.convertToThreeDigits(0), '000');
            assert.equal(consts.convertToThreeDigits('0'), '000');
            assert.equal(consts.convertToThreeDigits(20), '020');
            assert.equal(consts.convertToThreeDigits('20'), '020');
            assert.equal(consts.convertToThreeDigits(999), '999');
            assert.equal(consts.convertToThreeDigits('999'), '999');
        });
        it('should return the number if its greater than 999', function() {
            assert.equal(consts.convertToThreeDigits(1000), '1000');
            assert.equal(consts.convertToThreeDigits('1000'), '1000');
        });
        it('should return the number with a decimal if it exists', function() {
            assert.equal(consts.convertToThreeDigits(999.1), '999.1');
            assert.equal(consts.convertToThreeDigits('999.1'), '999.1');
            assert.equal(consts.convertToThreeDigits('1000.1'), '1000.1');
        });
    });
    describe('#replaceEscapedCharacters()', function() {
        it('should replace &47; with /', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &47; &47;'), 'Word / /');
        });
        it('should replace &92; with \\', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &92;'), 'Word \\');
        });
        it('should replace &58; with :', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &58;'), 'Word :');
        });
        it('should replace &42; with *', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &42;'), 'Word *');
        });
        it('should replace &63; with ?', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &63;'), 'Word ?');
        });
        it('should replace &34; with "', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &34;'), 'Word "');
        });
        it('should replace &60; with <', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &60;'), 'Word <');
        });
        it('should replace &lt; with <', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &lt;'), 'Word <');
        });
        it('should replace &62; with >', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &62;'), 'Word >');
        });
        it('should replace &gt; with >', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &gt;'), 'Word >');
        });
        it('should replace &124; with |', function() {
            assert.equal(consts.replaceEscapedCharacters('Word &124;'), 'Word |');
        });
    });
    describe('#sanitizeHtml()', function() {
        it('remove all tags except p tags', function() {
            assert.equal(consts.sanitizeHtml('<p><span/>qwdqwdqwdq</p>'), '<p>qwdqwdqwdq</p>');
            assert.equal(consts.sanitizeHtml('<p>qwdqwdqwdq</p>'), '<p>qwdqwdqwdq</p>');
            assert.equal(consts.sanitizeHtml('<div>qwdqwdqwdq</div>'), 'qwdqwdqwdq');
        });
    });
});