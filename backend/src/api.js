const request = require('request');
const fs = require('fs');
const xml = require('./xml');
const consts = require('./consts');

var apiKey = '?api_key=' + consts.apiKey;
var userAgent = 'Mozilla/5.0';
var volume = {
    url: 'https://www.comicvine.gamespot.com/api/volumes/' + apiKey + '&offset=0&filter=name:',
    fieldList: ['api_detail_url', 'name', 'start_year'].join(','),
    fieldListDetailed: ['characters', 'count_of_issues', 'description' , 'id' , 'image', 'issues', 'locations', 'name', 'people', 'publisher', 'start_year'].join(',')
};
var issue = {
    url: 'https://www.comicvine.gamespot.com/api/issues/' + apiKey + '&offset=0&filter=volume:',
    fieldList: ['api_detail_url', 'cover_date', 'id' , 'image', 'issue_number', 'name', 'volume'].join(','),
    fieldListDetailed: ['character_credits', 'description', 'location_credits', 'person_credits'].join(',')
};

function getVolume(name, year, cb) {
    requestVolume(name, year, function(err, volume) {
        if (err) {
            return cb(err);
        }
        requestIssues(volume.id, function(err, issues) {
            if (err) {
                return cb(err);
            }
            volume.issues = issues;
            return cb(null, volume);
        });
    });
}

function requestVolume(name, year, cb) {
    var options = {
        'url': volume.url,
        'headers': {'user-agent': userAgent}
    };
    options.url += consts.replaceEscapedCharacters(name).toLowerCase().replace(/[ ]/g, '_');
    options.url += '&field_list=' + volume.fieldList;

    request(options, function (err, res) {
        if (err) {
            return cb(err);
        }
        // res.body is xml
        xml.parseVolume(res.body, name, year, function(err, res) {
            if (err) {
                return cb(err);
            }
            requestDetailedVolume(res.api_detail_url, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
            });
        });
    });
}

function requestDetailedVolume(url, cb) {
    var options = {
        'url': url + apiKey + '&field_list=' + volume.fieldListDetailed,
        'headers': {'user-agent': userAgent}
    };
    request(options, function (err, res) {
        if (err) {
            return cb(err);
        }
        // res.body is xml
        xml.xmlToJs(res.body, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}

function requestIssues(volumeId, cb) {
    var options = {
        'url': issue.url + volumeId + '&field_list=' + issue.fieldList,
        'headers': {'user-agent': userAgent}
    };

    requestIssuesHelper(options, 0, "", function(err, res) {
        if (err) {
            return cb(err);
        }
        // set issue numbers to int for sorting
        for (let i = 0; i < res.issue.length; i++) {
            res.issue[i].issue_number = parseInt(res.issue[i].issue_number);
        }
        return cb(null, res.issue);
    });
}

function requestIssuesHelper(options, offset, issues, cb) {
    request(options, function (err, res) {
        // res.body is xml
        issues += res.body.match(/<results>(.*)<\/results>/g);
        issues = issues.replace('<results>', '');
        issues = issues.replace('</results>', '');

        //regex match number of page results and total results
        var pageResults = res.body.match(/<number_of_page_results>(.*?)<\/number_of_page_results>/g);
        pageResults = pageResults[0].match(/[0-9]+/g);
        var totalResults = res.body.match(/<number_of_total_results>(.*)<\/number_of_total_results>/g);
        totalResults = totalResults[0].match(/[0-9]+/g);

        // if page results < total results recall helper with new offset
        if (parseInt(pageResults[0]) + offset < parseInt(totalResults[0])) {
            offset = parseInt(offset)+parseInt(pageResults[0]);
            options.url = options.url.replace(/offset=[0-9]+/g, 'offset=' + offset);
            requestIssuesHelper(options, offset, issues, cb);
        } else {
            issues = '<results>' + issues + '</results>';
            xml.xmlToJs(issues, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
            });
        }
    });
}

function requestDetailedIssue(url, cb) {
    var options = {
        'url': url + apiKey + '&field_list=' + issue.fieldListDetailed,
        'headers': {'user-agent': userAgent}
    };
    request(options, function (err, res) {
        if (err) {
            return cb(err);
        }
        // res.body is xml
        xml.xmlToJs(res.body, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}

function requestCover(url, path, cb) {
    var options = {
        'url': url,
        'headers': {'user-agent': userAgent},
        'encoding': null
    };
    request.get(options, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            var folder = path.split('/').pop();
            var filename = url.split('/').pop().replace(/[^0-9a-z.]/gi, '');

            fs.writeFile(path + '/' + filename, new Buffer(body));

            return cb(null, folder + '/' + filename);
        } else {
            return cb(err);
        }
    });
}

module.exports.getVolume = getVolume;
module.exports.requestDetailedIssue = requestDetailedIssue;
module.exports.requestCover = requestCover;