var fs = require('fs');
var consts = require('./consts')

 function scan (cb) {
     fs.readdir(consts.ComicDirectory, function (err, folders) {
         scanIssues(folders, [], function(err, directory) {
             return cb(err, directory);
         });
     });
 }

 function scanIssues (folders, directory, cb) {
    var folder = folders[directory.length];

    var startYear = folder.substr(folder.length - 6);
    startYear = startYear.replace('(', '').replace(')', '');

    var title = folder.slice(0, folder.length - 7);

    var path = consts.ComicDirectory + '/' + folder;
    fs.readdir(path, function (err, issues) {
        var temp = [];
        for (var i = 0; i < issues.length; i++) {
            temp.push(issues[i]);
        }
        directory.push({
            'folder': folder,
            'volume': title,
            'start_year': startYear,
            'issues': temp
        });
        if (directory.length == folders.length) {
            return cb(0, directory);
        } else {
            scanIssues(folders, directory, cb);
        }
    });
 }

function getIssueFile (issue, cb) {
    var issueNumber = consts.convertToThreeDigits(issue.issue_number);
    var issuePath = consts.ComicDirectory + '/' + issue.volumeName + ' (' + issue.startYear + ')';
    var fileName =  issue.volumeName + ' - ' + issueNumber;
    fs.readdir(issuePath, function (err, issues) {
         for (var i = 0; i < issues.length; i++) {
            var extension = issues[i].substr(issues[i].lastIndexOf('.') + 1);
            if (fileName == issues[i].slice(0, -4)) {
                return cb(issuePath + '/' + fileName + '.' + extension);
            }
         }
    });
}

module.exports.scan = scan;
module.exports.getIssueFile = getIssueFile;