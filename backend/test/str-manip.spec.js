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
        it('returns 0 if it is all zeroes', function() {
            assert.equal(strManip.removeLeadingZeroes('0'), '0');
            assert.equal(strManip.removeLeadingZeroes('000'), '0');
        });
    });
    describe('#dissectFileName()', function() {
        it('split name correctly', function() {
            assert.deepEqual(strManip.dissectFileName('Name - 001.cbr'), {
                name: 'Name',
                issueNumber: '1',
                sortNumber: 1,
                sortLetter: '',
                ext: 'cbr'
            });
            assert.deepEqual(strManip.dissectFileName('Name-With-Hyphens - 001.cbr'), {
                name: 'Name-With-Hyphens',
                issueNumber: '1',
                sortNumber: 1,
                sortLetter: '',
                ext: 'cbr'
            });
            assert.deepEqual(strManip.dissectFileName('Name-Without-Extension - 001'), {
                name: 'Name-Without-Extension',
                issueNumber: '1',
                sortNumber: 1,
                sortLetter: '',
                ext: ''
            });
            assert.deepEqual(strManip.dissectFileName('Name - 006AU.cbr'), {
                name: 'Name',
                issueNumber: '6AU',
                sortNumber: 6,
                sortLetter: 'AU',
                ext: 'cbr'
            });
            assert.deepEqual(strManip.dissectFileName('Name - 023.2.cbr'), {
                name: 'Name',
                issueNumber: '23.2',
                sortNumber: 23.2,
                sortLetter: '',
                ext: 'cbr'
            });
        });
    });
});