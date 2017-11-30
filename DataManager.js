var fs = require('fs');
var scanner = require('./scanner');
var db = require('./db');
var api = require('./api');
var archive = require('./archive');
var consts = require('./consts');

function startRefresh(debug) {
    if (debug) {
        var date = new Date();
        console.log('[' + date.getTime() + '] Running DB refresh...')
        scanVolumes();
    } else {
        setInterval(function () {
            var date = new Date();
            console.log('[' + date.getTime() + '] Running DB refresh...')
            scanVolumes();
        }, consts.refreshInterval * 60 * 1000);
    }
}

function scanVolumes() {
    if (!fs.existsSync(consts.thumbDirectory)) {
        fs.mkdirSync(consts.thumbDirectory);
    }

    scanner.scan(function(err, directory) {
        db.getAllVolumes(function(library) {
            for (var i = 0; i < directory.length; i++) {
                var match = false;
                for (var j = 0; j < library.length; j++) {
                    if (directory[i].volume === library[j].name && directory[i].start_year === library[j].start_year) {
                        match = true;
                        break;
                    }
                }
                if (match) {
                    //existing volume
                    processVolume(directory[i], library[j]);
                } else {
                    //new volume
                    processVolume(directory[i], null);
                }
            }
        });
    });
}
function processVolume(dirVolume, dbVolume) {
    if (dbVolume === null) {
        api.getFullVolume(dirVolume.volume, dirVolume.start_year, function(volume) {
            api.getCover(volume.image.super_url, consts.thumbDirectory + '/' + dirVolume.folder, function (path) {
                volume.cover = path;
                processIssues(dirVolume, volume, function(issues) {
                    issues.sort(function (a, b) {
                        if (parseInt(a.issue_number) < parseInt(b.issue_number)) {
                            return -1;
                        }
                        if (parseInt(a.issue_number) > parseInt(b.issue_number)) {
                            return 1;
                        }
                        return 0;
                    });
                    volume.issues = issues;
                    db.upsertVolume(volume);
                    console.log('Finished processing "' + volume.name + '"');
                });
            });
        });
    } else {
        processIssues(dirVolume, dbVolume, function(issues) {
            issues.sort(function (a, b) {
                if (parseInt(a.issue_number) < parseInt(b.issue_number)) {
                    return -1;
                }
                if (parseInt(a.issue_number) > parseInt(b.issue_number)) {
                    return 1;
                }
                return 0;
            });
            dbVolume.issues = issues;
            db.upsertVolume(dbVolume);
            console.log('Finished processing "' + dbVolume.name + '"');
        });
    }
}
function processIssues(directoryVolume, dbVolume, cb) {
    var results = [];

    for (var i = 0; i < dbVolume.issues.length; i++) {
        var curDbIssue = dbVolume.name + ' - ' + consts.convertToThreeDigits(dbVolume.issues[i].issue_number);
        var match = false;
        for (var j = 0; j < directoryVolume.issues.length; j++) {
            var curDirIssue = directoryVolume.issues[j].slice(0, -4);
            if (curDirIssue === curDbIssue) {
                match = true;
                break;
            }
        }
        if (match) {
            dbVolume.issues[i].active = 'Y';
            dbVolume.issues[i].file_path = directoryVolume.folder + '/' + directoryVolume.issues[i];
            processIssue(dbVolume.issues[i], function (issue) {
                results.push(issue);
                console.log('Finished processing issue: ' + issue.file_path);
                if (results.length === dbVolume.issues.length) {
                    return cb(results);
                }
            });
        } else {
            dbVolume.issues[i].active = 'N';
            results.push(dbVolume.issues[i]);
            if (results.length === dbVolume.issues.length) {
                return cb(results);
            }
        }
    }
}
function processIssue(dbIssue, cb) {
    if (typeof(dbIssue.page_count) === 'undefined' || typeof(dbIssue.cover) === 'undefined') {// || typeof(dbIssue.thumbnails) === 'undefined') {
        archive.extractIssue(dbIssue.file_path, function (err, handler, entries, ext) {
            if (!err) {
                archive.getPageCount(entries, function (count) {
                    var imagePath = consts.thumbDirectory + '/' + dbIssue.file_path.split('/')[0];
                    api.getCover(dbIssue.image.super_url, imagePath, function(path) {
                        //archive.getThumbnails(handler, entries, ext, function(thumbnails) {
                            dbIssue.page_count = count;
                            dbIssue.cover = path;
                            //dbIssue.thumbnails = thumbnails;
                            return cb(dbIssue);
                        //});
                    });
                });
            } else {
                return cb(dbIssue);
            }
        });
    } else {
        return cb(dbIssue);
    }
}

module.exports.startRefresh = startRefresh;