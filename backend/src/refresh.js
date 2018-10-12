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
                addVolume(item.volume, item.start_year, function(err, volume) {
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
    let compareFolders = function(a, b) {
        return a.folder === b.folder;
    };

    db.find({collection: 'directory'}, function(err, curDir) {
        if (err) {
            return cb(err);
        }

        let promises = [];

        let diff = fad.diff(curDir, newDir, compareFolders);

        for (let i = 0; i < diff.removed.length; i++) {
            let params = {
                collection: 'directory',
                query: {folder: diff.removed[i].folder}
            };
            promises.push(new Promise(function (resolve, reject) {
                db.remove(params, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null);
                    }
                });
            }));
        }
        for (let i = 0; i < diff.added.length; i++) {
            let params = {
                collection: 'directory',
                identifier: {folder: diff.added[i].folder},
                document: diff.added[i]
            };
            promises.push(new Promise(function (resolve, reject) {
                db.replace(params, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null);
                    }
                });
            }));
        }

        let same = fad.same(curDir, newDir, compareFolders);

        for (let i = 0; i < same.length; i++) {
            let curD = curDir.find(function (dir) { return dir.folder === same[i].folder });
            let newD = newDir.find(function (dir) { return dir.folder === same[i].folder });

            if (fad.same(curD.issues, newD.issues).length !== newD.issues.length) {
                let params = {
                    collection: 'directory',
                    query: {folder: curD.folder},
                    update: {issues: newD.issues}
                };
                promises.push(new Promise(function (resolve, reject) {
                    db.update(params, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(null);
                        }
                    });
                }));
            }
        }

        Promise.all(promises).then(function() {
            db.find({collection: 'directory'}, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
            });
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