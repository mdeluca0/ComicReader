const chokidar = require('chokidar');
const fad = require('fast-array-diff');
const scanner = require('./scanner');
const db = require('./db');
const api = require('./api');
const consts = require('./consts');

const watcher = chokidar.watch(consts.comicDirectory, {ignored: /(^|[\/\\])\../, persistent: true});

var scanThreshold = setTimeout(refresh, 3000);

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
    scanner.scan(function(err, directory) {
        if (err) {
            return err;
        }
        syncDirectory(directory, function(err, newDir) {
            if (err) {
                return err;
            }
            newDir.forEach(function(item) {
                addVolume(item.name, item.start_year, function(err, volume) {
                    if (err) {
                        return err;
                    }
                    addIssues(volume.id, volume.count_of_issues, function(err, issues) {
                        if (err) {
                            return err;
                        }
                    });
                });
            });
        });
    });
}

function syncDirectory(newDir, cb) {
    db.find({collection: 'directory', query: {parent: null}}, function(err, curVolumes) {
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
        for (let i = 0; i < updates.removed.length; i++) {
            let remove = {
                collection: 'directory',
                query: {$or: [{_id: updates.removed[i]._id}, {parent: updates.removed[i]._id}]}
            };
            promises.push(new Promise(function(resolve, reject) {
                db.remove(remove, function (err, res) {
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
            let insert = {
                collection: 'directory',
                identifier: {file: updates.added[i].file},
                document: {
                    name: updates.added[i].name,
                    start_year: updates.added[i].start_year,
                    file: updates.added[i].file,
                    parent: null
                }
            };
            promises.push(new Promise(function(resolve, reject) {
                db.replace(insert, function (err, id) {
                    if (err) {
                        reject(err);
                    }
                    syncIssues(issues, id, function (err) {
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
                db.find({collection: 'directory', query: {file: updates.same[i].file}}, function(err, res) {
                    if (err) {
                        reject(err);
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
             db.find({collection: 'directory', query: {parent: null}}, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
             });
        });

    });
}

function syncIssues(newIssues, volumeId, cb) {
    db.find({collection: 'directory', query: {parent: volumeId}}, function(err, res) {
        if (err) {
            return cb(err);
        }

        let promises = [];

        let compareIssues = function(a, b) {
            return a.file === b.file;
        };
        let diff = fad.diff(res, newIssues, compareIssues);

        for (let j = 0; j < diff.added.length; j++) {
            let insert = {
                collection: 'directory',
                identifier: {file: diff.added[j]},
                document: {file: diff.added[j], parent: volumeId}
            };
            promises.push(new Promise(function(resolve, reject) {
                db.replace(insert, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    resolve(res);
                });
            }));
        }
        for (let j = 0; j < diff.removed.length; j++) {
            let remove = {
                collection: 'directory',
                query: {_id: diff.removed[j]._id.toString()}
            };
            promises.push(new Promise(function(resolve, reject) {
                db.remove(remove, function (err, res) {
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
    findVolumes({name: name, start_year: year}, function(err, res) {
        if (err) {
            return cb(err);
        }

        if (res.length) {
            return cb(null, res[0]);
        }

        requestVolume(name, year, function(err, volume) {
            if (err) {
                return cb(err);
            }

            volume.description = volume.description.replace(/<h4>Collected Editions.*/, '');
            volume.description = sanitizeHtml(volume.description);
            volume.cover = volume.image.super_url;
            volume.detailed = 'N';

            let volumeCoverPromise = new Promise(function(resolve, reject) {
                let imageUrl = volume.image.super_url;
                let fileName = imageUrl.split('/').pop();
                let path = consts.thumbDirectory + '/' + volume.id.toString() + '/' + fileName;

                api.imageRequest(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(imgPath);
                    }
                });
            });

            volumeCoverPromise.then(function(res) {
                volume.cover = res;
            }).catch(function(err) {
                console.log(err);
            }).then(function() {
                upsertVolume(volume, function(err) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, volume);
                });
            });
        });
    });
}

function addIssues(volumeId, issueCount, cb) {
    findIssues({'volume.id': volumeId}, function(err, curIssues) {
        if (err) {
            return cb(err);
        }

        if (issueCount != null && curIssues.length === parseInt(issueCount)) {
            return cb(null, curIssues);
        }

        let requestPromise = new Promise(function(resolve, reject) {
            requestIssues(volumeId, function(err, issues) {
                if (err) {
                    reject(err);
                }

                let count = 0;

                issues.forEach(function(issue) {
                    issue.description = sanitizeHtml(issue.description);
                    issue.cover = issue.image.super_url;
                    issue.detailed = 'N';

                    let imageUrl = issue.image.super_url;
                    let fileName = imageUrl.split('/').pop();
                    let path = consts.thumbDirectory + '/' + volumeId.toString() + '/' +  fileName;

                    api.imageRequest(imageUrl, path, function (err, imgPath) {
                        if (err) {
                            console.log(err);
                        } else {
                            issue.cover = imgPath;
                        }

                        count++;
                        if (count === issues.length) {
                            resolve(issues);
                        }
                    });
                });
            });
        });

        let compareIssues = function(a, b) {
            return a.id === b.id;
        };

        requestPromise.then(function(newIssues) {
            let diff = fad.diff(curIssues, newIssues, compareIssues);
            let count = 0;

            for (let i = 0; i < diff.added.length; i++) {
                upsertIssue(diff.added[i], function(err) {
                    if (err) {
                        console.log(err);
                    }
                    count++;
                    if (count === diff.added.length) {
                        findIssues({'volume.id': volumeId}, function(err, issues) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, issues);
                        });
                    }
                });
            }
        }).catch(function(err) {
            return cb(err);
        });
    });
}

function requestVolume(name, year, cb) {
    var params = {
        url: consts.apiUrl + 'volumes/',
        filter: 'name:' + consts.replaceEscapedCharacters(name).toLowerCase().replace(/[ ]/g, '_'),
        fieldList: ['api_detail_url', 'id', 'name', 'start_year', 'count_of_issues', 'description', 'image']
    };

    api.apiRequest(params, function(err, volumes) {
        if (err) {
            return cb(err);
        }

        volumes = volumes.volume;

        //find volume with matching name and year
        let volume = volumes.find(function(volume) {
            return volume.name === name && volume.start_year === year
        });

        if (volume) {
            return cb(null, volume);
        } else {
            return cb('Volume with name and year not found');
        }
    });
}

function requestIssues(volumeId, cb) {
    var params = {
        url: consts.apiUrl + 'issues/',
        filter: 'volume:' + volumeId.toString(),
        fieldList: ['api_detail_url', 'id', 'cover_date', 'image', 'issue_number', 'name', 'volume', 'description']
    };

    api.apiRequest(params, function(err, issues) {
        if (err) {
            return cb(err);
        }

        issues = issues.issue;

        //set issue numbers to integers so mongodb can sort them
        for (let i = 0; i < issues.length; i++) {
            issues[i].issue_number = parseInt(issues[i].issue_number);
        }

        issues.sort(function(a, b) { return a.issue_number - b.issue_number });

        return cb(null, issues);
    });
}

function findVolumes(query, cb) {
    let params = {
        collection: 'volumes',
        query: query
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function findIssues(query, cb) {
    let params = {
        collection: 'issues',
        query: query,
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
    let params = {
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
    let params = {
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

function sanitizeHtml(html) {
    //return html.replace(/<(?:.|\\n)*?>/g, ''); //this is all tags
    return html.replace(/<\/?(?!p)\w*\b[^>]*>/g, ''); //all but <p> tags
}