const xml2js = require('xml2js');
const parser = new xml2js.Parser({explicitArray: false});

function xmlToJs(xml, cb) {
    parser.parseString(xml, function(err, res) {
        if (err) {
            return cb(err);
        }

        if (res.results) {
            return cb(null, res.results);
        } else if (res.response.results) {
            return cb(null, res.response.results);
        } else {
            return cb(1);
        }
    });
}

module.exports.xmlToJs = xmlToJs;