var request = require('request');
var fs = require('fs');
var xml = require('./xml');
var consts = require('./consts');

var apiKey = require('./consts').apiKey;
var volumeUrl =  'https://www.comicvine.gamespot.com' + '/api/volumes/?api_key=' + apiKey + '&offset=0&filter=name:';
var volumeFieldList = '&field_list=count_of_issues,description,id,image,name,start_year,characters,issues';
var issueFieldList = '&field_list=cover_date,description,id,image,issue_number,name,person_credits';
var userAgent = 'Mozilla/5.0';


function requestVolume (name, year, cb) {
    getVolume(name, year, function(volume) {
        getIssues(volume.issues.issue, function(issues) {
            volume.issues = issues;
            return cb(volume);
        });
    });
}

function getVolume(name, year, cb) {
    var options = {
        'url': volumeUrl,
        'headers': {'user-agent': userAgent}
    };
    name = consts.replaceEscapedCharacters(name);
    options.url += name.toLowerCase().replace(/[ ]/g, '_');
    options.url += '&field_list=name,start_year,api_detail_url';

    request(options, function (err, res) {
        // res.body is xml
        xml.parseVolume(res.body, name, year, function(err, res) {
            getVolumeDetails(res.api_detail_url, function(err, res) {
                return cb(res);
            });
        });
    });
}

function getVolumeDetails(url, cb) {
    url += '?api_key=' + apiKey + volumeFieldList;
    var options = {
        'url': url,
        'headers': {'user-agent': userAgent}
    };
    request(options, function (err, res) {
        // res.body is xml
        xml.stringToXml(res.body, function(err, res) {
            return cb(0, res);
        });
    });
};

function getIssues(issues, cb) {
    var results = [];

    for (var i = 0; i < issues.length; i++) {
        var options = {
            'url': issues[i].api_detail_url + '?api_key=' + apiKey + issueFieldList,
            'headers': {'user-agent': userAgent}
        };

        request(options, function (err, res) {
            // res.body is xml
            xml.stringToXml(res.body, function(err, res) {
                results.push(res);
                if (results.length == issues.length) {
                    results.sort(function(a, b) { return a.issue_number - b.issue_number });
                    return cb(results);
                }
            });
        });
    }
}

function getCover(url, path, cb) {
    request.get({'url': url, 'headers': {'User-Agent': userAgent}, 'encoding': null}, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            var folder = path.split('/').pop();
            var filename = url.split('/').pop().replace(/[^0-9a-z.]/gi, '');

            fs.writeFile(path + '/' + filename, new Buffer(body));

            return cb(folder + '/' + filename);
        } else {
            return cb('');
        }
    });
}

module.exports.requestVolume = requestVolume;
module.exports.getCover = getCover;