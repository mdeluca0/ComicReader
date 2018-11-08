const request = require('request');
const fs = require('fs');
const xml = require('./xml');
const config = require('./config');

function apiRequest(params, cb) {
    if (!params.url) {
        return cb("No url supplied");
    }

    let options = {
        url: params.url + '?api_key=' + config.apiKey + '&offset=0',
        headers: {'user-agent': config.userAgent}
    };

    if (params.filter) {
        options.url += '&filter=' + params.filter;
    }
    if (params.fieldList) {
        options.url += '&field_list=' + params.fieldList.join(',');
    }

    apiRequestHelper(options, 0, "", function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function apiRequestHelper(options, offset, results, cb) {
    request(options, function (err, res) {
        if (err) {
            return cb(err);
        }

        // res.body is xml
        results += res.body.match(/<results>(.*)<\/results>/gs);
        results = results.replace('<results>', '').replace('</results>', '');

        //regex match number of page results and total results
        var pageResults = res.body.match(/<number_of_page_results>(.*?)<\/number_of_page_results>/g);
        pageResults = pageResults[0].match(/[0-9]+/g);
        var totalResults = res.body.match(/<number_of_total_results>(.*)<\/number_of_total_results>/g);
        totalResults = totalResults[0].match(/[0-9]+/g);

        // if page results < total results recall helper with new offset
        if (parseInt(pageResults[0]) + offset < parseInt(totalResults[0])) {
            offset = parseInt(offset) + parseInt(pageResults[0]);
            options.url = options.url.replace(/offset=[0-9]+/g, 'offset=' + offset);
            apiRequestHelper(options, offset, results, cb);
        } else {
            results = '<results>' + results + '</results>';
            xml.xmlToJs(results, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
            });
        }
    });
}

function imageRequest(url, path, cb) {
    let options = {
        'url': url,
        'headers': {'user-agent': config.userAgent},
        'encoding': null
    };
    request(options, function (err, res, body) {
        if (err) {
            return cb(err);
        }
        if (res.statusCode === 200) {
            let dir = path.split('/');
            let fileName = decodeURIComponent(dir.pop());
            dir = dir.join('/');

            let cover = dir.replace(config.thumbDirectory + '/', '') + '/' + fileName;

            if (fs.existsSync(dir + '/' + fileName)) {
                return cb(null, cover);
            }

            mkDirRecursive(dir);

            fs.writeFile(dir + '/' + fileName, new Buffer(body), function(err){
                if (err) {
                    return cb(err);
                }

                return cb(null, cover);
            });
        } else {
            return cb('Image request failed with status code: ' + res.statusCode.toString());
        }
    });
}

function mkDirRecursive(path) {
    let parts = path.split('/');
    let curPath = '';
    let length = parts.length;

    for (let i = 0; i < length; i++) {
        if (curPath !== '') {
            curPath += '/';
        }

        let part = parts.shift();

        curPath += part;

        if (part.indexOf(':') !== -1) {
            continue;
        }

        if (!fs.existsSync(curPath)) {
            fs.mkdirSync(curPath);
        }
    }
}

module.exports.apiRequest = apiRequest;
module.exports.imageRequest = imageRequest;
