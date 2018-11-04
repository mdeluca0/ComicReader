const chokidar = require('chokidar');
const fad = require('fast-array-diff');
const scanner = require('./scanner');
const consts = require('./consts');
const directoryRepo = require('./repositories/directory-repository');
const volumesRepo = require('./repositories/volumes-repository');
const issuesRepo = require('./repositories/issues-repository');
const storyarcsRepo = require('./repositories/storyarcs-repository');
const apiRepo = require('./repositories/api-repository');

const watcher = chokidar.watch(consts.comicDirectory, {ignored: /(^|[\/\\])\../, persistent: true});

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
        console.log('Refresh started...');

        scanner.scan(function (err, directory) {
            if (err) {
                console.log('Refresh Failed - ' + err);
                refreshing = false;
                return err;
            }
            syncDirectory(directory, function (err, newDir) {
                if (err) {
                    console.log('Refresh Failed - ' + err);
                    refreshing = false;
                    return err;
                }

                let promises = [];

                for (let i = 0; i < newDir.length; i++) {
                    let volumeName = newDir[i].name;
                    let volumeYear = newDir[i].start_year;
                    promises.push(new Promise(function (resolve, reject) {
                        addVolume(volumeName, volumeYear, function (err, volume) {
                            if (err) {
                                reject(err);
                            }
                            addIssues(volume.id, volume.start_year, volume.count_of_issues, function (err, issues) {
                                if (err) {
                                    reject(err);
                                }
                                resolve(null);
                            });
                        });
                    }));
                }

                Promise.all(promises).then(function() {
                    checkCovers(function(err) {
                        if (err) {
                            console.log('Refresh Failed - ' + err);
                            refreshing = false;
                            return err;
                        }
                        console.log('Refresh Finished Successfully!');
                        refreshing = false;
                    });
                }).catch(function(err){
                    console.log('Refresh Failed - ' + err);
                    refreshing = false;
                });
            });
        });
    }
}

function syncDirectory(newDir, cb) {
    directoryRepo.find({parent: null}, {name: 1, start_year: 1}, {}, function(err, curVolumes) {
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
                removeQuery.push({_id: updates.removed[i]._id});
                removeQuery.push({parent: updates.removed[i]._id});
            }
            removeQuery = {$or: removeQuery};
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.remove(removeQuery, function (err, res) {
                    if (err) {
                        reject(err);
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
                name: updates.added[i].name,
                start_year: updates.added[i].start_year,
                file: updates.added[i].file,
                parent: null
            };
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.upsert(query, document, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    syncIssues(issues, res.upsertedId._id, function (err) {
                        if (err) {
                            reject(err);
                        }
                        resolve(null);
                    });
                });
            }));
        }

        //Update existing volumes
        for (let i = 0; i < updates.same.length; i++) {
            let issues = updates.same[i].issues;
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.find({file: updates.same[i].file}, {name: 1, start_year: 1}, {}, function(err, res) {
                    if (err) {
                        reject(err);
                    }
                    if (!res.length) {
                        resolve(null);
                    }
                    syncIssues(issues, res[0]._id.toString(), function (err) {
                        if (err) {
                            reject(err);
                        }
                        resolve(null);
                    });
                });
            }));
        }

        Promise.all(promises).then(function() {
             directoryRepo.find({parent: null}, {name: 1, start_year: 1}, {}, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
             });
        });

    });
}

function syncIssues(newIssues, volumeId, cb) {
    volumeId = consts.convertId(volumeId);

    directoryRepo.find({parent: volumeId}, {issue_number: 1}, {}, function(err, res) {
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
                let insert = {
                    file: diff.added[i],
                    issue_number: parseInt(diff.added[i].match(/[0-9][0-9][0-9]/g).pop()),
                    parent: volumeId
                };
                promises.push(new Promise(function (resolve, reject) {
                    directoryRepo.upsert({file: insert.file}, insert, function (err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(res);
                    });
                }));
            }
        }

        if (diff.removed.length) {
            let removeQuery = [];
            for (let i = 0; i < diff.removed.length; i++) {
                removeQuery.push({_id: diff.removed[i]._id.toString()});
            }
            removeQuery = {$or: removeQuery};
            promises.push(new Promise(function(resolve, reject) {
                directoryRepo.remove(removeQuery, function (err, res) {
                    if (err) {
                        reject(err);
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
    volumesRepo.find({name: name, start_year: year}, {}, {}, function(err, res) {
        if (err) {
            return cb(err);
        } else if (res.length) {
            return cb(null, res[0]);
        }

        apiRepo.requestVolume(name, year, function(err, volume) {
            if (err) {
                return cb(err);
            }

            volume.description = volume.description.replace(/<h4>Collected Editions.*/, '');
            volume.description = consts.sanitizeHtml(volume.description);
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
    issuesRepo.find({'volume.id': volumeId}, {issue_number: 1}, {}, function(err, curIssues) {
        if (err) {
            return cb(err);
        } else if (issueCount != null && curIssues.length === parseInt(issueCount)) {
            return cb(null, curIssues);
        }

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
                issue.volume.start_year = startYear;
                issue.description = consts.sanitizeHtml(issue.description);
                issue.detailed = 'N';

                promises.push(new Promise(function(resolve, reject) {
                    issuesRepo.upsert({id: issue.id}, issue, function (err, res) {
                        if (err) {
                            reject(err);
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

function checkCovers(cb) {
    let promises = [];

    promises.push(new Promise(function(resolve, reject) {
        volumesRepo.find({cover: {$exists: false}}, {}, {}, function (err, volumes) {
            if (err) {
                reject(err);
            }
            resolve(volumes);
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        issuesRepo.find({cover: {$exists: false}}, {}, {}, function (err, issues) {
            if (err) {
                reject(err);
            }
            resolve(issues);
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        storyarcsRepo.find({cover: {$exists: false}, detailed: 'Y'}, {}, {}, function (err, storyArcs) {
            if (err) {
                reject(err);
            }
            resolve(storyArcs);
        });
    }));

    Promise.all(promises).then(function(results) {
        let volumes = results[0];
        let issues = results[1];
        let storyArcs = results[2];
        let promises = [];

        for (let i = 0; i < volumes.length; i++) {
            let id = volumes[i].id.toString();
            let imageUrl = volumes[i].image.super_url;
            let fileName = imageUrl.split('/').pop();
            let path = consts.thumbDirectory + '/' + id + '/' + fileName;

            promises.push(new Promise(function(resolve, reject) {
                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                    }
                    volumesRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(res);
                    });
                });
            }));
        }

        for (let i = 0; i < issues.length; i++) {
            let id = issues[i].id;
            let volumeId = issues[i].volume.id.toString();
            let imageUrl = issues[i].image.super_url;
            let fileName = imageUrl.split('/').pop();
            let path = consts.thumbDirectory + '/' + volumeId + '/' + fileName;

            promises.push(new Promise(function(resolve, reject) {
                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                    }
                    issuesRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(res);
                    });
                });
            }));
        }

        for (let i = 0; i < storyArcs.length; i++) {
            promises.push(new Promise(function (resolve, reject) {
                let id = storyArcs[i].id.toString();
                let imageUrl = storyArcs[i].image.super_url;
                let fileName = imageUrl.split('/').pop();
                let path = consts.thumbDirectory + '/story_arcs/' + fileName;

                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                    }
                    storyarcsRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(res);
                    });
                });
            }));
        }

        Promise.all(promises).then(function() {
            return cb(null);
        }).catch(function(err) {
            return cb(err);
        });

    }).catch(function(err) {
        return cb(err);
    });
}