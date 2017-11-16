var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});

function parseVolume (xml, name, year, cb) {
    parser.parseString(xml, function(err, res) {
        xml = res.response.results.volume;
        var found = false;
        for (var i = 0; i < xml.length; i++) {
            if (xml[i].name == name && xml[i].start_year == year) {
                found = true;
                return cb(0, xml[i]);
            }
        }
        if (!found) {
            return cb(1, "Couldn't find a volume name or year match in xml");
        }
    });
}

function stringToXml (xml, cb) {
    parser.parseString(xml, function(err, res) {
        xml = res.results;
        return cb(0, xml);
    });
}

module.exports.parseVolume = parseVolume;
module.exports.stringToXml = stringToXml;