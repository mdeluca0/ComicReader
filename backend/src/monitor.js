const chokidar = require('chokidar');
const fs = require('fs');
const scanner = require('./scanner');
const db = require('./db');
const api = require('./api');
const archive = require('./archive');
const consts = require('./consts');

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
            upsertIssue(Object.assign(issue, details), function(err, res) {
                if (err) {
                    return err;
                }
            });
            console.log('Updated...' + issue.volume.name + ' - ' + issue.name);
        });
    } else {
        getUndetailedIssues(function(err, res) {
            if (err) {
                return err;
            }
            for (let i = 0; i < res.length; i++) {
                requestQueue.push(res[i]);
            }
        });
    }
}, 1000);

//TODO: get details on demand
//TODO: queue files with missing covers on file change to retry

// Scans the book directory for new volumes or issues added so that we can populate their metadata.
function refresh() {
    // Makes a directory for the thumbnails if it doesn't exist
    //TODO: fix for recursive folder creation
    if (!fs.existsSync(consts.thumbDirectory)) {
        fs.mkdirSync(consts.thumbDirectory);
    }

    scanner.scan(function(err, directory) {
        if (err) {
            return err;
        }
        directory.forEach(function(dirItem) {
            getVolumeByNameAndYear(dirItem.volume, dirItem.start_year, function(err, dbItem) {
                if (err) {
                    return err;
                }
                if (dbItem.length) {
                    dbItem = dbItem.shift();
                    getIssuesByVolume(dbItem.id, function (err, issues) {
                        if (err) {
                            return err;
                        }
                        dbItem.issues = issues;
                        processVolume(dirItem, dbItem);
                    });
                } else {
                    processVolume(dirItem, null);
                }
            });
        });
    });
}

function processVolume(dirVolume, dbVolume) {
    // New volume found in the directory which is why dbVolume is null. Going to attempt to find it's metadata.
    if (dbVolume == null) {
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
                    for (let i = 0; i < issues.length; i++) {
                        upsertIssue(issues[i], function(err, res) {
                            if (err) {
                                return err;
                            }
                        });
                    }
                    delete volume.issues;
                    volume.description = volume.description.replace(/<h4>Collected Editions.*/, '');
                    volume.description = volume.description.replace(/<(?:.|\\n)*?>/g, '');
                    upsertVolume(volume, function(err, res) {
                        if (err) {
                            return err;
                        }
                    });
                    console.log('Finished processing "' + volume.name + '"');
                });
            });
        });
    } else {
        processIssues(dirVolume, dbVolume, function(issues) {
            for (let i = 0; i < issues.length; i++) {
                upsertIssue(issues[i], function(err, res) {
                    if (err) {
                        return err;
                    }
                });
            }
            upsertVolume(dbVolume, function(err, res) {
                if (err) {
                    return err;
                }
            });
            console.log('Finished processing "' + dbVolume.name + '"');
        });
    }
}

function processIssues(directoryVolume, dbVolume, cb) {
    var results = [];

    for (var i = 0; i < dbVolume.issues.length; i++) {
        var match = false;

        for (var j = 0; j < directoryVolume.issues.length; j++) {
            var curDbIssue = dbVolume.name + ' - ' + consts.convertToThreeDigits(dbVolume.issues[i].issue_number.toString());
            var curDirIssue = consts.replaceEscapedCharacters(directoryVolume.issues[j].toString().replace(/\.[^/.]+$/, ''));

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

function getVolumeByNameAndYear(name, year, cb) {
    var params = {
        collection: 'volumes',
        query: {'name': name, 'start_year': year}
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getIssuesByVolume(volumeId, cb) {
    var params = {
        collection: 'issues',
        query: {'volume.id': volumeId},
        sort: {'issue_number': 1}
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsertVolume(document, cb) {
    var params = {
        collection: 'volumes',
        identifier: {id: document.id},
        document: document
    };
    db.replace(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsertIssue(document, cb) {
    var params = {
        collection: 'issues',
        identifier: {id: document.id},
        document: document
    };
    db.replace(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getUndetailedIssues(cb) {
    var params = {
        collection: 'issues',
        query: {'detailed': {'$not': /[Y]/}}
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

/*function getCorruptIssues(cb) {
    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find({'cover': {'$not': /[Y]/}}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}*/