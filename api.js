var request = require('request');
var xml = require('./xml');

var apiKey = require('./consts').apiKey;
var volumeFieldList = '&field_list=count_of_issues,name,id,image,start_year';
var issueFieldList = '&field_list=cover_date,description,id,image,issue_number,name';
var userAgent = 'Mozilla/5.0';

var volumesOptions = {
    url: 'https://www.comicvine.gamespot.com' + '/api/volumes/?api_key=' + apiKey + '&offset=0&filter=name:',
    headers: {
        'User-Agent': userAgent
    }
};

var issuesOptions = {
    url: 'https://www.comicvine.gamespot.com' + '/api/issues/?api_key=' + apiKey + '&offset=0&filter=volume:',
    headers: {
        'User-Agent': userAgent
    }
};

function getFullVolume (name, year, cb) {
    getVolume(name, year, function(volume) {
        getIssues(volume.id, function(issues) {
            volume.issues = issues.issue;
            return cb(volume);
        });
    });
}

function getVolume (name, year, cb) {
    var options = {
        'url': volumesOptions.url,
        'headers': volumesOptions.headers
    };
    options.url += name.toLowerCase().replace(/[ ]/g, '_');
    options.url += volumeFieldList;

    request(options, function (err, res) {
        // res.body is xml
        xml.parseVolume(res.body, name, year, function(err, res) {
            getVolumeCover(res.image.super_url, function(img) { //get volume cover as base 64
                res.cover = img;
                return cb(res);
            });
        });
    });
}

function getIssues(volumeId, cb) {
    var options = {
        'url': issuesOptions.url,
        'headers': issuesOptions.headers
    };
    options.url += volumeId;
    options.url += issueFieldList;

    var offset = 0;
    var issues = "";

    issuesRequest(options, offset, issues, function(err, res) {
        // sort issues by issue number
        res.issue.sort(function(a, b) { return a.issue_number - b.issue_number });
        return cb(res);
    });
}

function issuesRequest(options, offset, issues, cb) {
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

        // if page results < total results recall request with new offset
        if (parseInt(pageResults[0]) + offset < parseInt(totalResults[0])) {
            offset = parseInt(offset)+parseInt(pageResults[0]);
            options.url = options.url.replace(/offset=[0-9]+/g, 'offset=' + offset);
            issuesRequest(options, offset, issues, cb);
        } else {
            issues = '<results>' + issues + '</results>';
            xml.stringToXml(issues, function(err, res) {
                return cb(0, res);
            });
        }
    });
}

function getVolumeCover(url, cb) {
    request.get({'url': url, 'headers': {'User-Agent': userAgent}, 'encoding': null}, function (err, res, body) {
        if (!err && res.statusCode === 200) {
            var base64Img = new Buffer(body).toString('base64');
            return cb(base64Img);
        } else {
            return cb('');
        }
    });
}

module.exports.getFullVolume = getFullVolume;