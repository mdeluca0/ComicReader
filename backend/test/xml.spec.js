const assert = require('assert');
const xml = require('../src/xml');

describe('xml', function() {
    describe('#xmlToJs()', function() {
        it('single child', function() {
            let s = "<results><volume><id>a</id></volume></results>";
            xml.xmlToJs(s, function(err, res) {
                assert.deepEqual(res, {volume: {id: 'a'}});
            });
        });
        it('children with identical names', function() {
            let s = "<results><volume><id>a</id></volume><volume><id>b</id></volume></results>";
            xml.xmlToJs(s, function(err, res) {
                assert.deepEqual(res, {volume: [{id: 'a'}, {id: 'b'}]});
            });
        });
        it('children with different names', function() {
            let s = "<results><volume><id>a</id></volume><issue><id>b</id></issue></results>";
            xml.xmlToJs(s, function(err, res) {
                assert.deepEqual(res, {volume: {id: 'a'}, issue: {id: 'b'}});
            });
        });
        it('multiple children with same or different names', function() {
            let s = "<results><volume><id>a</id></volume><volume><id>i</id></volume><issue><id>b</id></issue></results>";
            xml.xmlToJs(s, function(err, res) {
                assert.deepEqual(res, {volume: [{id: 'a'}, {id: 'i'}], issue: {id: 'b'}});
            });
        });
        it('empty string', function() {
            let s = "";
            xml.xmlToJs(s, function(err, res) {
                assert.deepEqual(res, {});
            });
        });
    });
});