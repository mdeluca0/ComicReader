const api = require('../api');
const strManip = require('../str-manip');
const sorts = require('../sorts');
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

    api.apiRequest(params, function(err, res) {
        if (err) {
            return cb(err);
        }

        if (res === {}) {
            return cb('No metadata found for volume ' + name);
        }

        let volumes = res.volume;

        // If there is only one volume found, it doesn't return as an array
        if (!Array.isArray(volumes)) {
            volumes = [volumes];
        }

        //find volume with matching name and year
        let volume = volumes.find(function(volume) {
            return volume.name === name && volume.start_year === year;
        });

        if (volume) {
            return cb(null, volume);
        } else {
            return cb('Volume with ' + name + ' and ' + year + ' not found');
        }
    });
}

function requestIssues(volumeId, cb) {
    let params = {
        url: config.apiUrl + 'issues/',
        filter: 'volume:' + volumeId.toString(),
        fieldList: ['api_detail_url', 'id', 'cover_date', 'image', 'issue_number', 'name', 'volume', 'description']
    };

    api.apiRequest(params, function(err, res) {
        if (err) {
            return cb(err);
        }

        if (res === {}) {
            return cb('No issue metadata found for volume ' + volumeId);
        }

        let issues = res.issue;

        // If there is only one issue found, it doesn't return as an array
        if (!Array.isArray(issues)) {
            issues = [issues];
        }

        // Assign volume order
        issues.sort(sorts.sortIssueNumber);
        for (let i = 0; i < issues.length; i++) {
            issues[i].index_in_volume = i;
        }

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

        return cb(null, storyArc);
    });
}

module.exports.requestImage = requestImage;
module.exports.requestVolume = requestVolume;
module.exports.requestIssues = requestIssues;
module.exports.detailVolume = detailVolume;
module.exports.detailIssue = detailIssue;
module.exports.detailStoryArc = detailStoryArc;