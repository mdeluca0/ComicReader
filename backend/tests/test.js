var db = require('../src/db');
var archive = require('../src/archive');
module.exports.test = function() {
    var params = {
        collection: 'issues',
        query: {'id': '6694'}
    };
    db.find(params, function(err, issue) {
        if (err) {
            return err;
        }
        archive.extractIssue(issue[0].file_path, function (err, handler, entries, ext) {
            if (err) {
                return err;
            }
            archive.getPage(handler, entries, ext, '2', function (err, base64Img) {
                if (err) {
                    return err;
                }
                return base64Img;
            });
        });
    });
};