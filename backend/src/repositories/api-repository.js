const api = require('../api');
const strManip = require('../str-manip');
const config = require('../config');

function requestImage(url, path, cb) {
    api.imageRequest(url, path, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function requestVolume(name, year, cb) {
    name = strManip.replaceEscapedCharacters(name);

    let params = {
        url: config.apiUrl + 'volumes/',
        filter: 'name:' + name.toLowerCase().replace(/[ ]/g, '_'),
        fieldList: ['api_detail_url', 'id', 'name', 'start_year', 'count_of_issues', 'description', 'image']
    };

    api.apiRequest(params, function(err, volumes) {
        if (err) {
            return cb(err);
        }

        volumes = volumes.volume;

        //find volume with matching name and year
        let volume = volumes.find(function(volume) {
            return volume.name === name && volume.start_year === year;
        });

        if (volume) {
            return cb(null, volume);
        } else {
            return cb('Volume with name and year not found');
        }
    });
}

function requestIssues(volumeId, cb) {
    let params = {
        url: config.apiUrl + 'issues/',
        filter: 'volume:' + volumeId.toString(),
        fieldList: ['api_detail_url', 'id', 'cover_date', 'image', 'issue_number', 'name', 'volume', 'description']
    };

    api.apiRequest(params, function(err, issues) {
        if (err) {
            return cb(err);
        }

        issues = issues.issue;

        issues.sort(function(a, b) {
            if(a.issue_number < b.issue_number) { return -1; }
            if(a.issue_number > b.issue_number) { return 1; }
            return 0;
        });

        return cb(null, issues);
    });
}

function detailVolume(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'characters', 'locations', 'people', 'publisher']
    };
    api.apiRequest(params, function(err, volume) {
        if (err) {
            return cb(err);
        }

        volume.detailed = 'Y';

        return cb(null, volume);
    });
}

function detailIssue(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'character_credits', 'story_arc_credits', 'location_credits', 'person_credits']
    };
    api.apiRequest(params, function(err, issue) {
        if (err) {
            return cb(err);
        }

        issue.detailed = 'Y';

        return cb(null, issue);
    });
}

function detailStoryArc(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'deck', 'image', 'issues', 'publisher']
    };
    api.apiRequest(params, function(err, storyArc) {
        if (err) {
            return cb(err);
        }

        storyArc.detailed = 'Y';
        let imageUrl = storyArc.image.super_url;
        let fileName = imageUrl.split('/').pop();
        let path = config.thumbDirectory + '/story_arcs/' + fileName;

        requestImage(imageUrl, path, function (err, imgPath) {
            if (!err) {
                storyArc.cover = imgPath;
            }
            return cb(null, storyArc);
        });
    });
}

module.exports.requestImage = requestImage;
module.exports.requestVolume = requestVolume;
module.exports.requestIssues = requestIssues;
module.exports.detailVolume = detailVolume;
module.exports.detailIssue = detailIssue;
module.exports.detailStoryArc = detailStoryArc;