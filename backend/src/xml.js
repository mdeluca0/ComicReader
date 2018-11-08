const xml2js = require('xml2js');
const parser = new xml2js.Parser({explicitArray: false});

function xmlToJs(xml, cb) {
    parser.parseString(xml, function(err, res) {
        if (err) {
            return cb(err);
        }

        if (res == null) {
            return {};
        } else if (res.results != null) {
            return cb(null, res.results);
        } else {
            return cb('No xml result from ' + xml);
        }
    });
}

module.exports.xmlToJs = xmlToJs;