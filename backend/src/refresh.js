const chokidar = require('chokidar');
const fad = require('fast-array-diff');
const scanner = require('./scanner');
const strManip = require('./str-manip');
const sorts = require('./sorts');
const config = require('./config');
const directoryRepo = require('./repositories/directory-repository');
const volumesRepo = require('./repositories/volumes-repository');
const issuesRepo = require('./repositories/issues-repository');
const apiRepo = require('./repositories/api-repository');

const watcher = chokidar.watch(config.comicDirectory, {ignored: /(^|[\/\\])\../, persistent: true});

var scanThreshold = setTimeout(refresh, 3000);
var refreshing = false;

watcher.on('ready', function(path) {
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

function refresh() {
    if (!refreshing) {
        refreshing = true;
        console.log('\x1b[32m%s\x1b[0m', 'Refresh started...');

        scanner.scan(function (err, directory) {
            if (err) {
                console.log('\x1b[31m%s\x1b[0m', 'Scanner Failed - ' + err);
                refreshing = false;
                return err;
            }
            syncDirectory(directory, function (err, newDir) {
                if (err) {
                    console.log('\x1b[31m%s\x1b[0m', 'Sync Directory Failed - ' + err);
                    refreshing = false;
                    return err;
                }

                let promises = [];

                for (let i = 0; i < newDir.length; i++) {
                    let volumeName = newDir[i].name;
                    let volumeYear = newDir[i].start_year;
                    promises.push(new Promise(function (resolve, reject) {
                        console.log('\x1b[32m%s\x1b[0m', 'Adding ' + volumeName + ' (' + volumeYear + ')...');
                        addVolume(volumeName, volumeYear, function (err, volume) {
                            if (err) {
                                console.log('\x1b[31m%s\x1b[0m', 'Failed - Add ' + volumeName + ' (' + volumeYear + ')');
                                resolve(err);
                                return;
                            }
                            console.log('\x1b[32m%s\x1b[0m', 'Adding ' + volumeName + ' (' + volumeYear + ') Issues...');
                            addIssues(volume.id, volume.start_year, volume.count_of_issues, function (err, issues) {
                                if (err) {
                                    console.log('\x1b[31m%s\x1b[0m', 'Failed - Add ' + volumeName + ' (' + volumeYear + ') Issues');
                                    resolve(err);
                                    return;
                                }
                                console.log('\x1b[32m%s\x1b[0m', 'Success - Add ' + volumeName + ' (' + volumeYear + ') Issues');
                                resolve(null);
                            });
                        });
                    }));
                }

                Promise.all(promises).then(function() {
                    console.log('\x1b[32m%s\x1b[0m', 'Refresh Finished!');
                    refreshing = false;
                });
            });
        });
    }
}

function syncDirectory(newDir, cb) {
    directoryRepo.find({parent: null}, {name: 1, start_year: 1}, {}, null, function(err, curVolumes) {
        if (err) {
            return cb(err);
        }

        let compareVolumes = function(a, b) {
            return a.file === b.file;
        };

        let updates = Object.assign(
            fad.diff(curVolumes, newDir, compareVolumes),
            {same: fad.same(newDir, curVolumes, compareVolumes)}
        );

        let promises = [];

        //Delete removed volumes
        if (updates.removed.length) {
            let removeQuery = [];
            for (let i = 0; i < updates.removed.length; i++) {
                let _id = require('./db').convertId(updates.removed[i]._id);
                removeQuery.push({_id: _id});
                removeQuery.push({parent: _id});
            }
            removeQuery = {$or: removeQuery};
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.remove(removeQuery, function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(res);
                });
            }));
        }

        //Add new volumes
        for (let i = 0; i < updates.added.length; i++) {
            let issues = updates.added[i].issues;
            let query = {file: updates.added[i].file};
            let document = {
                name: strManip.replaceEscapedCharacters(updates.added[i].name),
                start_year: updates.added[i].start_year,
                file: updates.added[i].file,
                parent: null
            };
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.upsert(query, document, function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    directoryRepo.find(query, {}, {}, null, function(err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (!res.length) {
                            resolve(null);
                            return;
                        }
                        syncIssues(issues, res[0]._id, function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(null);
                        });
                    });
                });
            }));
        }

        //Update existing volumes
        for (let i = 0; i < updates.same.length; i++) {
            let file = updates.same[i].file;
            let issues = updates.same[i].issues;
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.find({file: file}, {name: 1, start_year: 1}, {}, null, function(err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!res.length) {
                        resolve(null);
                        return;
                    }
                    syncIssues(issues, res[0]._id.toString(), function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                });
            }));
        }

        Promise.all(promises).then(function() {
             directoryRepo.find({parent: null}, {name: 1, start_year: 1}, {}, null, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
             });
        });

    });
}

function syncIssues(newIssues, volumeId, cb) {
    volumeId = require('./db').convertId(volumeId);

    directoryRepo.find({parent: volumeId}, {file: 1}, {}, null, function(err, res) {
        if (err) {
            return cb(err);
        }

        let promises = [];

        let compareIssues = function(a, b) {
            return a.file === b;
        };

        let diff = fad.diff(res, newIssues, compareIssues);

        if (diff.added.length) {
            for (let i = 0; i < diff.added.length; i++) {
                let fileParts = strManip.dissectFileName(diff.added[i]);

                let insert = {
                    file: diff.added[i],
                    issue_number: fileParts.issueNumber,
                    sort_number: fileParts.sortNumber,
                    sort_letter: fileParts.sortLetter,
                    parent: volumeId
                };
                promises.push(new Promise(function (resolve, reject) {
                    directoryRepo.upsert({file: insert.file}, insert, function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(res);
                    });
                }));
            }
        }

        if (diff.removed.length) {
            let removeQuery = [];
            for (let i = 0; i < diff.removed.length; i++) {
                let _id = require('./db').convertId(diff.removed[i]._id);
                removeQuery.push({_id: _id});
            }
            removeQuery = {$or: removeQuery};
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.remove(removeQuery, function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(res);
                });
            }));
        }

        Promise.all(promises).then(function() {
           return cb(null);
        }).catch(function(err) {
            return cb(err);
        });
    });
}

function addVolume(name, year, cb) {
    volumesRepo.find({name: name, start_year: year}, {}, {}, null, function(err, res) {
        if (err) {
            return cb(err);
        } else if (res.length) {
            return cb(null, res[0]);
        }

        apiRepo.requestVolume(name, year, function(err, volume) {
            if (err) {
                return cb(err);
            }

            if (volume.id === null) {
                return cb('Volume ' + name + '(' + year + ') has null id');
            }

            volume.description = volume.description.replace(/<h4>Collected Editions.*/, '');
            volume.description = strManip.removeHtmlTags(volume.description);
            volume.detailed = 'N';

            volumesRepo.upsert({id: volume.id}, volume, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, volume);
            });
        });
    });
}

function addIssues(volumeId, startYear, issueCount, cb) {
    issuesRepo.find({'volume.id': volumeId}, {}, {}, null, function (err, curIssues) {
        if (err) {
            return cb(err);
        } else if (issueCount != null && curIssues.length === parseInt(issueCount)) {
            return cb(null, curIssues);
        }

        curIssues.sort(sorts.sortIssueNumber);

        apiRepo.requestIssues(volumeId, function(err, issues) {
            if (err) {
                return cb(err);
            }

            let promises = [];

            let compareIssues = function(a, b) {
                return a.issue_number === b.issue_number;
            };
            let added = fad.diff(curIssues, issues, compareIssues).added;

            for (let i = 0; i < added.length; i++) {
                let issue = added[i];

                if (issue.id === null) {
                    continue;
                }

                issue.volume.start_year = startYear;
                issue.description = strManip.removeHtmlTags(issue.description);
                issue.detailed = 'N';

                promises.push(new Promise(function(resolve, reject) {
                    issuesRepo.upsert({id: issue.id}, issue, function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(res);
                    });
                }));
            }

            Promise.all(promises).then(function() {
                return cb(null, issues);
            }).catch(function(err) {
                return cb(err);
            });
        });
    });
}