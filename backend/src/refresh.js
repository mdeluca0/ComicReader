const chokidar = require('chokidar');
const scanner = require('./scanner');
const db = require('./db');
const api = require('./api');
const archive = require('./archive');
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
    // Makes a directory for the thumbnails if it doesn't exist
    consts.mkDirRecursive(consts.thumbDirectory);

    scanner.scan(function(err, directory) {
        if (err) {
            console.log(err);
            return;
        }
        directory.forEach(function (dirItem) {
            var getMetadataPromise = new Promise(function (resolve, reject) {
                findVolumes({'name': dirItem.volume, 'start_year': dirItem.start_year}, function (err, dbItem) {
                    if (err) {
                        reject(err);
                    }
                    if (dbItem.length) {
                        findIssues({'volume.id': dbItem[0].id}, function (err, issues) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({volume: dbItem[0], issues: issues});
                            }
                        });
                    } else {
                        addVolume(dirItem.volume, dirItem.start_year, function (err, volume) {
                            if (err) {
                                reject(err);
                            }
                            addIssues(volume, function (err, issues) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve({volume: volume, issues: issues});
                                }
                            });
                        });
                    }
                });
            });

            getMetadataPromise.then(function(res) {
                updateVolume(dirItem, res.volume, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Finished updating volume for ' + res.volume.name);
                });
                updateIssues(dirItem.issues, res, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Finished updating issues for ' + res.volume.name);
                });
            }).catch(function(err) {
                console.log(err);
            });
        });
    });
}

function addVolume(name, year, cb) {
    requestVolume(name, year, function(err, volume) {
        if (err) {
            return cb(err);
        }

        volume.description = volume.description.replace(/<h4>Collected Editions.*/, '');
        volume.description = sanitizeHtml(volume.description);
        volume.cover = volume.image.super_url;
        volume.detailed = 'N';
        volume.active = 'N';

        let volumeCoverPromise = new Promise(function(resolve, reject) {
            let imageUrl = volume.cover;
            let fileName = imageUrl.split('/').pop();
            let path = consts.thumbDirectory + '/' + volume.name + ' (' + volume.start_year + ')/' + fileName;

            api.imageRequest(imageUrl, path, function (err, imgPath) {
                if (err) {
                    reject(err);
                } else {
                    resolve(imgPath);
                }
            });
        });

        volumeCoverPromise.then(function(res) {
            volume.cover = volume.name + ' (' + volume.start_year + ')/' + res;
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
}

function addIssues(volume, cb) {
    requestIssues(volume.id, function(err, issues) {
        if (err) {
            return cb(err);
        }

        let count = 0;

        issues.forEach(function(issue) {
            issue.description = sanitizeHtml(issue.description);
            issue.cover = issue.image.super_url;
            issue.detailed = 'N';
            issue.active = 'N';

            let issueCoverPromise = new Promise(function (resolve, reject) {
                let imageUrl = issue.image.super_url;
                let fileName = imageUrl.split('/').pop();
                let path = consts.thumbDirectory + '/' + volume.name + ' (' + volume.start_year + ')/' + fileName;

                api.imageRequest(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(imgPath);
                    }
                });
            });

            issueCoverPromise.then(function (res) {
                issue.cover = volume.name + ' (' + volume.start_year + ')/' + res;
            }).catch(function (err) {
                console.log(err);
            }).then(function () {
                upsertIssue(issue, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    count++;
                    if (count === issues.length) {
                        return cb(null, issues);
                    }
                });
            });
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
        for (let i = 0; i < volumes.length; i++) {
            if (volumes[i].name === name && volumes[i].start_year === year) {
                return cb(null, volumes[i]);
            }
        }

        return cb('Volume with name and year not found');
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

        return cb(null, issues);
    });
}

function updateVolume(dirVolume, dbVolume, cb) {
    let wasActive = dbVolume.active;

    if (dirVolume.issues.length > 0) {
        dbVolume.active = 'Y';
    } else {
        dbVolume.active = 'N';
    }

    if (wasActive !== dbVolume.active) {
        upsertVolume(dbVolume, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null);
        });
    } else {
        return cb(null);
    }
}

function updateIssues(dirIssues, metadata, cb) {
    let dbIssues = metadata.issues;

    for (var i = 0; i < dirIssues.length; i++) {
        let match = false;
        for (var j = 0; j < dbIssues.length; j++) {
            let curDirIssue = consts.replaceEscapedCharacters(dirIssues[i].toString().replace(/\.[^/.]+$/, ''));
            let curDbIssue = dbIssues[j].volume.name + ' - ' + consts.convertToThreeDigits(dbIssues[j].issue_number.toString());
            if (curDbIssue === curDirIssue) {
                match = true;
                break;
            }
        }

        const index = j;

        if (match) {
            dbIssues[index].active = 'Y';
            dbIssues[index].date_added = consts.getToday();
            dbIssues[index].file_path = metadata.volume.name + ' (' + metadata.volume.start_year + ')/' + dirIssues[i];
            getIssuePageCount(dbIssues[index].file_path, function(err, res) {
                if (err) {
                    dbIssues[index] = 'Unknown';
                }
                dbIssues[index].page_count = res;
                upsertIssue(dbIssues[index], function(err) {
                    if (err) {
                        return cb(err);
                    }
                });
            });
        } else {
            dbIssues[index].active = 'N';
            dbIssues[index].date_added = '';
            dbIssues[index].file_path = '';
            upsertIssue(dbIssues[index], function(err) {
                if (err) {
                    return cb(err);
                }
            });
        }
    }
    return cb(null);
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

function getIssuePageCount(filePath, cb) {
    archive.extractIssue(filePath, function (err, handler, entries, ext) {
        if (err) {
            return cb(err);
        }
        archive.getPageCount(entries, function (err, count) {
            if (err) {
                return cb(err);
            }
            return cb(null, count);
        });
    });
}

function sanitizeHtml(html) {
    //return html.replace(/<(?:.|\\n)*?>/g, ''); //this is all tags
    return html.replace(/<\/?(?!p)\w*\b[^>]*>/g, '');
}