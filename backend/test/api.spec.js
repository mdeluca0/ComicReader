const assert = require('assert');
const config = require('../src/config');
const api = require('../src/api');

describe('api', function() {
    describe('#imageRequest()', function() {
        it('request valid image', function() {
            let url = 'https://www.comicvine.gamespot.com/api/image/scale_large/2700025-prv14172_cov.jpg';
            let path = config.thumbDirectory + '/test/2700025-prv14172_cov.jpg';
            api.imageRequest(url, path, function(err, res) {
                assert.equal(err, null);
                assert.equal(res, 'test/2700025-prv14172_cov.jpg');
            });
        });
        it('request invalid image', function() {
            let url = 'https://www.comicvine.gamespot.com/api/image/scale_large/invalid-name.jpg';
            let path = config.thumbDirectory + '/test/invalid-name.jpg';
            api.imageRequest(url, path, function(err, res) {
                assert.notEqual(err, null);
                assert.equal(res, null);
            });
        });
    });
});