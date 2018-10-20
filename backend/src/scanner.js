const fs = require('fs');
const consts = require('./consts');

function scan(cb) {
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

function scanIssues(folders, directory, cb) {
    if (!folders.length) {
        return cb(null, directory);
    }

    let folder = folders.shift();

    let startYear = folder.match(/\([0-9][0-9][0-9][0-9]\)/g);

    if (!startYear) {
        return cb("No year found");
    }

    startYear = startYear.pop().replace('(', '').replace(')', '');

    let title = folder.replace(/\.[^/.]+$/, '');
    title = folder.replace('(' + startYear + ')', '').trim();

    let path = consts.comicDirectory + '/' + folder;

    fs.readdir(path, function (err, issues) {
        if (err) {
            return cb(err);
        }

        let issuesCopy = issues.slice();

        directory.push({
            'file': folder,
            'name': title,
            'start_year': startYear,
            'issues': issuesCopy
        });

        scanIssues(folders, directory, cb);
    });
}

function getIssueFile(issue, cb) {
    let issueNumber = consts.convertToThreeDigits(issue.issue_number);
    let issuePath = consts.comicDirectory + '/' + issue.volumeName + ' (' + issue.startYear + ')';
    let fileName =  issue.volumeName + ' - ' + issueNumber;

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