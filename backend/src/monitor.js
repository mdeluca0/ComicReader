const volumesRepo = require('./repositories/volumes-repository');
const issuesRepo = require('./repositories/issues-repository');
const storyArcsRepo = require('./repositories/storyarcs-repository');
const apiRepo = require('./repositories/api-repository');
const promiseQueue = require('./promisequeue').PromiseQueue;

var requestQueue = new promiseQueue();

setInterval(function () {
    if (!requestQueue.isEmpty()) {
        requestQueue.dequeue();
        console.log('Updating item. ' + requestQueue.count() + ' items left in queue.');
    }
    populateRequestQueue();
}, 1500);

function populateRequestQueue() {
    let promises = [];

    promises.push(new Promise(function(resolve, reject) {
        volumesRepo.find({detailed: {$not: /[Y]/}}, {}, {}, function(err, volumes) {
            if (err) {
                reject(err);
            } else {
                resolve(volumes);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        issuesRepo.find({detailed: {$not: /[Y]/}}, {}, {}, function(err, issues) {
            if (err) {
                reject(err);
            } else {
                resolve(issues);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        storyArcsRepo.find({detailed: {$not: /[Y]/}}, {}, {}, function(err, storyArcs) {
            if (err) {
                reject(err);
            } else {
                resolve(storyArcs);
            }
        });
    }));

    // Resolve Promises
    Promise.all(promises).then(function(results) {
        for (let i = 0; i < results[0].length; i++) {
            requestQueue.enqueue('volume-' + results[0][i].id, 1, function(resolve, reject) {
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
            requestQueue.enqueue('issue-' + results[1][i].id, 3, function(resolve, reject) {
                apiRepo.detailIssue(results[1][i].api_detail_url, function(err, issue) {
                    if (err) {
                        reject(err);
                    }

                    if (issue.story_arc_credits.story_arc) {
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
            requestQueue.enqueue('story_arc-' + results[2][i].id, 2, function(resolve, reject) {
                apiRepo.detailStoryArc(results[2][i].api_detail_url, function(err, storyArc) {
                    if (err) {
                        reject(err);
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

function addStoryArc(storyArc, cb) {
    storyArcsRepo.find({id: storyArc.id}, {}, {}, function(err, res) {
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
