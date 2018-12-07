const config = require('./config');
const volumesRepo = require('./repositories/volumes-repository');
const issuesRepo = require('./repositories/issues-repository');
const storyArcsRepo = require('./repositories/storyarcs-repository');
const apiRepo = require('./repositories/api-repository');
const promiseQueue = require('./promisequeue').PromiseQueue;

var detailQueue = new promiseQueue();
var coversQueue = new promiseQueue();

setInterval(function () {
    if (!detailQueue.isEmpty()) {
        detailQueue.dequeue();
        console.log('Detailing item. ' + detailQueue.count() + ' items left in queue.');
    }
    populateDetailQueue();
}, 1500);

setInterval(function () {
    if (!coversQueue.isEmpty()) {
        coversQueue.dequeue();
    }
    populateCoversQueue();
}, 20);

function populateDetailQueue() {
    let promises = [];

    promises.push(new Promise(function(resolve, reject) {
        volumesRepo.find({detailed: {$not: /[Y]/}}, {}, {}, null, function(err, volumes) {
            if (err) {
                resolve([]);
            } else {
                resolve(volumes);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        issuesRepo.find({detailed: {$not: /[Y]/}}, {}, {}, null, function(err, issues) {
            if (err) {
                resolve([]);
            } else {
                resolve(issues);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        storyArcsRepo.find({detailed: {$not: /[Y]/}}, {}, {}, null, function(err, storyArcs) {
            if (err) {
                resolve([]);
            } else {
                resolve(storyArcs);
            }
        });
    }));

    Promise.all(promises).then(function(results) {
        for (let i = 0; i < results[0].length; i++) {
            detailQueue.enqueue('volume-' + results[0][i].id, 1, function(resolve, reject) {
                apiRepo.detailVolume(results[0][i].api_detail_url, function(err, volume) {
                    if (err) {
                        reject(err);
                    }
                    volumesRepo.upsert({id: volume.id}, volume, function(err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(null, res);
                    });
                });
            });
        }
        for (let i = 0; i < results[1].length; i++) {
            detailQueue.enqueue('issue-' + results[1][i].id, 3, function(resolve, reject) {
                apiRepo.detailIssue(results[1][i].api_detail_url, function(err, issue) {
                    if (err) {
                        reject(err);
                    }

                    if (issue.story_arc_credits && issue.story_arc_credits.story_arc) {
                        addStoryArc(issue.story_arc_credits.story_arc, function (err, res) {
                            if (err) {
                                //TODO: handle error
                            }
                        });
                    }

                    issuesRepo.upsert({id: issue.id}, issue, function(err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(null, res);
                    });
                });
            });
        }
        for (let i = 0; i < results[2].length; i++) {
            detailQueue.enqueue('story_arc-' + results[2][i].id, 2, function(resolve, reject) {
                apiRepo.detailStoryArc(results[2][i].api_detail_url, function(err, storyArc) {
                    if (err) {
                        reject(err);
                    }
                    if (!storyArc.id) {
                        reject('Story Arc missing id');
                    }
                    storyArcsRepo.upsert({id: storyArc.id}, storyArc, function(err, res) {
                        if (err) {
                            reject(err);
                        }
                        resolve(null, res);
                    });
                });
            });
        }
    });
}

function populateCoversQueue() {
    let promises = [];

    promises.push(new Promise(function(resolve, reject) {
        volumesRepo.find({cover: {$exists: false}}, {}, {}, null, function (err, volumes) {
            if (err) {
                resolve([]);
            } else {
                resolve(volumes);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        issuesRepo.find({cover: {$exists: false}}, {}, {}, null, function (err, issues) {
            if (err) {
                resolve([]);
            } else {
                resolve(issues);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        storyArcsRepo.find({cover: {$exists: false}, detailed: 'Y'}, {}, {}, null, function (err, storyArcs) {
            if (err) {
                resolve([]);
            } else {
                resolve(storyArcs);
            }
        });
    }));

    Promise.all(promises).then(function(results) {
        let volumes = results[0];
        let issues = results[1];
        let storyArcs = results[2];

        for (let i = 0; i < volumes.length; i++) {
            let id = volumes[i].id.toString();
            let imageUrl = volumes[i].image.super_url;
            let fileName = imageUrl.split('/').pop();
            let path = config.thumbDirectory + '/' + id + '/' + fileName;

            coversQueue.enqueue('volume-cover-' + id, 1, function(resolve, reject) {
                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    volumesRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                });
            });
        }

        for (let i = 0; i < issues.length; i++) {
            let id = issues[i].id;
            let volumeId = issues[i].volume.id.toString();
            let imageUrl = issues[i].image.super_url;
            let fileName = imageUrl.split('/').pop();
            let path = config.thumbDirectory + '/' + volumeId + '/' + fileName;

            coversQueue.enqueue('issue-cover-' + id, 1, function(resolve, reject) {
                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    issuesRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                });
            });
        }

        for (let i = 0; i < storyArcs.length; i++) {
            let id = storyArcs[i].id.toString();
            let imageUrl = storyArcs[i].image.super_url;
            let fileName = imageUrl.split('/').pop();
            let path = config.thumbDirectory + '/story_arcs/' + fileName;

            coversQueue.enqueue('story-arc-cover-' + id, 1, function(resolve, reject) {
                apiRepo.requestImage(imageUrl, path, function (err, imgPath) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    storyArcsRepo.upsert({id: id}, {cover: imgPath}, function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                });
            });
        }
    });
}

function addStoryArc(storyArc, cb) {
    if (!storyArc.id) {
        return cb('No story arc id to add from');
    }
    storyArcsRepo.find({id: storyArc.id}, {}, {}, null, function(err, res) {
        if (err) {
            return cb(err);
        }
        if (res.length) {
            return cb(null, res[0]);
        }

        storyArc.detailed = 'N';

        storyArcsRepo.upsert({id: storyArc.id}, storyArc, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}
