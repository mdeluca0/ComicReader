var scanner = require('./scanner');
var db = require('./db');
var api = require('./api');
var archive = require('./archive');
var consts = require('./consts');

function startRefresh(debug) {
    if (debug) {
        var date = new Date();
        console.log('[' + date.getTime() + '] Running DB refresh...')
        scanForNewVolumes();
        scanForActiveIssues();
    } else {
        setInterval(function () {
            var date = new Date();
            console.log('[' + date.getTime() + '] Running DB refresh...')
            scanForNewVolumes();
            scanForActiveIssues();
        }, consts.refreshInterval * 60 * 1000);
    }
}

function scanForNewVolumes () {
    scanner.scan(function(err, directory) {
        db.getAllVolumes(function(library) {
            for (var i = 0; i < directory.length; i++) {
                var match = false;
                for (var j = 0; j < library.length; j++) {
                    if (directory[i].volume === library[j].name && directory[i].start_year === library[j].start_year) {
                        match = true;
                    }
                }
                if (!match) {
                    //new volume found, insert it
                    pullMetadata(directory[i].volume, directory[i].start_year);
                }
            }
        });
    });
}

function pullMetadata (volume, startYear) {
    api.getFullVolume(volume, startYear, function(err, res) {
        db.upsertVolume(res);
    });
}

function scanForActiveIssues () {
    scanner.scan(function(err, directory) {
        db.getAllVolumes(function(library) {
            for (var i = 0; i < directory.length; i++) {
                for (var j = 0; j < library.length; j++) {
                    if (directory[i].volume === library[j].name && directory[i].start_year === library[j].start_year) {
                        markIssues(directory[i].issues, library[j].issues, library[j].name, library[j].id);
                    }
                }
            }
        });
    });
}

function markIssues (directoryIssues, libraryIssues, libraryVolumeName, libraryVolumeId) {
    for (var i = 0; i < libraryIssues.length; i++) {
        var match = false;
        for (var j = 0; j < directoryIssues.length; j++) {
            var issueNumber = consts.convertToThreeDigits(libraryIssues[i].issue_number);
            var libraryIssue = libraryVolumeName + ' - ' + issueNumber;
            var directoryIssue = directoryIssues[j].replace(/\.[^/.]+$/, "");

            if (directoryIssue === libraryIssue) {
                libraryIssues[i].active = 'Y';
                match = true;
            }
        }
        if (!match) {
            libraryIssues[i].active = 'N';
        }
    }
    archive.populatePageCounts(libraryIssues, function(issues) {
        db.updateIssues(libraryVolumeId, issues);
    });
}

module.exports.startRefresh = startRefresh;