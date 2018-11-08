const fs = require('fs');
const config = require('./config');

function scan(cb) {
    fs.readdir(config.comicDirectory, function (err, folders) {
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

    if (!startYear.length) {
        return cb("No year found");
    }

    startYear = startYear.pop().replace('(', '').replace(')', '');

    let title = folder.replace(/\.[^/.]+$/, '');
    title = folder.replace('(' + startYear + ')', '').trim();

    let path = config.comicDirectory + '/' + folder;

    fs.readdir(path, function (err, issues) {
        if (err) {
            return cb(err);
        }

        let issuesCopy = issues.slice();

        for (let i = 0; i < issuesCopy.length; i++) {
            let ext = issuesCopy[i].slice(-4);
            if (ext !== '.cbr' && ext !== '.cbz') {
                issuesCopy.splice(i, 1);
                i--;
            }
        }

        directory.push({
            'file': folder,
            'name': title,
            'start_year': startYear,
            'issues': issuesCopy
        });

        scanIssues(folders, directory, cb);
    });
}

module.exports.scan = scan;