const request = require('request');
const fs = require('fs');
const xml = require('./xml');
const consts = require('./consts');

function apiRequest(params, cb) {
    if (!params.url) {
        return cb("No url supplied");
    }

    let options = {
        url: params.url + '?api_key=' + consts.apiKey + '&offset=0',
        headers: {'user-agent': consts.userAgent}
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
        results += res.body.match(/<results>(.*)<\/results>/g);
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
    var options = {
        'url': url,
        'headers': {'user-agent': consts.userAgent},
        'encoding': null
    };
    request(options, function (err, res, body) {
        if (err) {
            return cb(err);
        }
        if (res.statusCode === 200) {
            let fileName = path.split('/').pop();

            if (fs.existsSync(path)) {
                return cb(null, fileName);
            }

            let dir = path.split('/').slice(0, -1).join('/');
            consts.mkDirRecursive(dir);

            fs.writeFile(path, new Buffer(body), function(err){
                if (err) {
                    return cb(err);
                }

                return cb(null, fileName);
            });
        } else {
            return cb('Image request failed with status code: ' + res.statusCode.toString());
        }
    });
}

module.exports.apiRequest = apiRequest;
module.exports.imageRequest = imageRequest;
