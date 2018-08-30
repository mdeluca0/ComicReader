var chokidar = require('chokidar');
var fs = require('fs');
var scanner = require('./scanner');
var db = require('./db');
var api = require('./api');
var archive = require('./archive');
var consts = require('./consts');

var watcher = chokidar.watch(consts.comicDirectory, {ignored: /(^|[\/\\])\../, persistent: true});

var scanThreshold;

// Initial
watcher.on('ready', function(path) {
    scanThreshold = setTimeout(refresh, 3000);

    // File added
    watcher.on('add', function(path) {
        clearTimeout(scanThreshold);
        scanThreshold = setTimeout(refresh, 8000);
    });

    // File changed
    watcher.on('change', function(path) {
        clearTimeout(scanThreshold);
        scanThreshold = setTimeout(refresh, 8000);
    });

    // File removed
    watcher.on('unlink', function(path) {
        clearTimeout(scanThreshold);
        scanThreshold = setTimeout(refresh, 8000);
    });
});

var requestQueue = [];

setInterval(function () {
    if (requestQueue.length) {
        var issue = requestQueue.shift();
        console.log('Requesting...' + issue.volume.name + ' - ' + issue.name);
        api.requestDetailedIssue(issue.api_detail_url, function (err, details) {
            if (err) {
                return err;
            }
            issue.detailed = 'Y';
            db.upsertIssue(Object.assign(issue, details));
            console.log('Updated...' + issue.volume.name + ' - ' + issue.name);
        });
    } else {
        db.getUndetailedIssues(function(err, res) {
            for (var i = 0; i < res.length; i++) {
                requestQueue.push(res[i]);
            }
        });
    }
}, 1000);

//TODO: get details on demand

// Scans the book directory for new volumes or issues added so that we can populate their metadata.
function refresh() {
    // Makes a directory for the thumbnails if it doesn't exist
    if (!fs.existsSync(consts.thumbDirectory)) {
        fs.mkdirSync(consts.thumbDirectory);
    }

    scanner.scan(function(err, directory) {
        if (err) {
            return err;
        }
        directory.forEach(function(dirItem) {
            db.getVolumeByNameAndYear(dirItem.volume, dirItem.start_year, function(err, dbItem) {
                if (err) {
                    return err;
                }
                dbItem = dbItem.shift();
                db.getIssuesByVolume(dbItem.id, function(err, issues) {
                    if (err) {
                        return err;
                    }
                    dbItem.issues = issues;
                    processVolume(dirItem, dbItem);
                });
            });
        });
    });
}

function processVolume(dirVolume, dbVolume) {
    // New volume found in the directory which is why dbVolume is null. Going to attempt to find it's metadata.
    if (typeof(dbVolume) === 'undefined') {
        api.getVolume(dirVolume.volume, dirVolume.start_year, function(err, volume) {
            if (err) {
                return err;
            }
            api.requestCover(volume.image.super_url, consts.thumbDirectory + '/' + dirVolume.folder, function (err, path) {
                if (!err) {
                    volume.cover = path;
                } else {
                    volume.cover = '';
                }

                processIssues(dirVolume, volume, function(issues) {
                    for (var i = 0; i < issues.length; i++) {
                        db.upsertIssue(issues[i]);
                    }
                    delete volume.issues;
                    db.upsertVolume(volume);
                    console.log('Finished processing "' + volume.name + '"');
                });
            });
        });
    } else {
        processIssues(dirVolume, dbVolume, function(issues) {
            for (var i = 0; i < issues.length; i++) {
                db.upsertIssue(issues[i]);
            }
            db.upsertVolume(dbVolume);
            console.log('Finished processing "' + dbVolume.name + '"');
        });
    }
}

function processIssues(directoryVolume, dbVolume, cb) {
    var results = [];

    for (var i = 0; i < dbVolume.issues.length; i++) {
        var match = false;

        for (var j = 0; j < directoryVolume.issues.length; j++) {
            var curDbIssue = dbVolume.name + ' - ' + consts.convertToThreeDigits(dbVolume.issues[i].issue_number);
            var curDirIssue = consts.replaceEscapedCharacters(directoryVolume.issues[j].replace(/\.[^/.]+$/, ''));

            if (curDbIssue === curDirIssue) {
                match = true;
                break;
            }
        }

        if (match) {
            dbVolume.issues[i].active = 'Y';
            dbVolume.issues[i].date_added = consts.getToday();
            dbVolume.issues[i].file_path = directoryVolume.folder + '/' + directoryVolume.issues[j];

            console.log('Started processing issue: ' + dbVolume.issues[i].file_path);

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
    if (typeof(dbIssue.page_count) === 'undefined' || typeof(dbIssue.cover) === 'undefined') {
        archive.extractIssue(dbIssue.file_path, function (err, handler, entries, ext) {
            if (err) {
                return cb(dbIssue);
            }
            archive.getPageCount(entries, function (pcErr, count) {
                var imagePath = consts.thumbDirectory + '/' + dbIssue.file_path.split('/')[0];
                api.requestCover(dbIssue.image.super_url, imagePath, function(covErr, path) {
                    if (!pcErr) {
                        dbIssue.page_count = count;
                    }
                    if (!covErr) {
                        dbIssue.cover = path;
                    }
                    return cb(dbIssue);
                });
            });
        });
    } else {
        return cb(dbIssue);
    }
}