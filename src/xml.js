var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});

function xmlToJs (xml, cb) {
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

function parseVolume (xml, name, year, cb) {
    xmlToJs(xml, function(err, res) {
        if (err) {
            return cb(err);
        }

        var volumeXml = res.volume;

        for (var i = 0; i < volumeXml.length; i++) {
            if (volumeXml[i].name === name && volumeXml[i].start_year === year) {
                return cb(null, volumeXml[i]);
            }
        }

        return cb(1);
    });
}

module.exports.xmlToJs = xmlToJs;
module.exports.parseVolume = parseVolume;