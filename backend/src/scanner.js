const fs = require('fs');
const consts = require('./consts');

function scan (cb) {
    fs.readdir(consts.comicDirectory, function (err, folders) {
        if (err) {
            return cb(err);
        }
        scanIssues(folders, [], function(err, directory) {
            if (err) {
                return cb(err);
            }
            return cb(null, directory);
        });
    });
}

function scanIssues (folders, directory, cb) {
    if (!folders.length) {
        return cb('No folders found from the scan.');
    }

    var folder = folders[directory.length];

    var startYear = folder.match(/\([0-9][0-9][0-9][0-9]\)/g);

    if (!startYear) {
        return cb(1);
    }

    startYear = startYear[startYear.length-1].replace('(', '').replace(')', '');

    var title = folder.replace(/\.[^/.]+$/, '');
    title = folder.replace('(' + startYear + ')', '').trim();

    var path = consts.comicDirectory + '/' + folder;

    fs.readdir(path, function (err, issues) {
        if (err) {
            return cb(err);
        }

        var issuesCopy = issues.slice();

        directory.push({
            'folder': folder,
            'volume': title,
            'start_year': startYear,
            'issues': issuesCopy
        });

        if (directory.length === folders.length) {
            return cb(null, directory);
        } else {
            scanIssues(folders, directory, cb);
        }
    });
}

function getIssueFile (issue, cb) {
    var issueNumber = consts.convertToThreeDigits(issue.issue_number);
    var issuePath = consts.comicDirectory + '/' + issue.volumeName + ' (' + issue.startYear + ')';
    var fileName =  issue.volumeName + ' - ' + issueNumber;

    fs.readdir(issuePath, function (err, issues) {
        if (err) {
            return cb(err);
        }
         for (let i = 0; i < issues.length; i++) {
            let extension = issues[i].substr(issues[i].lastIndexOf('.') + 1);

            if (fileName === issues[i].replace(/\.[^/.]+$/, '')) {
                return cb(null, issuePath + '/' + fileName + '.' + extension);
            }
         }
    });
}

module.exports.scan = scan;
module.exports.getIssueFile = getIssueFile;