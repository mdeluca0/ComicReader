var chokidar = require('chokidar');
var fs = require('fs');
var scanner = require('./scanner');
var db = require('./db');
var api = require('./api');
var archive = require('./archive');
var consts = require('./consts');

var watcher = chokidar.watch(consts.comicDirectory, {ignored: /(^|[\/\\])\../, persistent: true});

// Initial
watcher.on('ready', function(path) {
    scanVolumes();

    // File added
    watcher.on('add', function(path) { scanVolumes(); });

    // File changed
    watcher.on('change', function(path) { scanVolumes(); });

    // File removed
    watcher.on('unlink', function(path) { scanVolumes(); });
});

var requestQueue = [];

setInterval(function () {
    if (requestQueue.length) {
        var func = requestQueue.shift();
        func();
    }
}, 1000);

//TODO: get details on demand

// Scans the book directory for new volumes or issues added so that we can populate their metadata.
function scanVolumes() {
    // Makes a directory for the thumbnails if it doesn't exist
    if (!fs.existsSync(consts.thumbDirectory)) {
        fs.mkdirSync(consts.thumbDirectory);
    }

    scanner.scan(function(err, directory) {
        if (err) {
            return err;
        }
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
    // New volume found in the directory which is why dbVolume is null. Going to attempt to find it's metadata.
    if (dbVolume === null) {
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

                    // Queue detailed requests
                    for (var i = 0; i < volume.issues.length; i++) {
                        var curIssue = volume.issues[i];
                        var requestCb = (function(e) {
                            api.requestDetailedIssue(e.api_detail_url, function (err, res) {
                                db.detailIssue(volume.id, e.id, res);
                            });
                        })(curIssue);
                        requestQueue.push(requestCb);
                    }
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