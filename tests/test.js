var api = require('../api');
module.exports.test = function() {
    api.getVolume('The X-Men', '1963', function(err, res) {
        console.log(res);
    });
};

