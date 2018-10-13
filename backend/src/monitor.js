const db = require('./db');
const api = require('./api');
const promiseQueue = require('./promisequeue').PromiseQueue;

var requestQueue = new promiseQueue();

setInterval(function () {
    if (!requestQueue.isEmpty()) {
        requestQueue.dequeue();
    } else {
        populateRequestQueue();
    }
}, 1000);

function populateRequestQueue() {
    let promises = [];

    promises.push(new Promise(function(resolve, reject) {
        let params = {
            collection: 'volumes',
            query: {'detailed': {'$not': /[Y]/}}
        };
        db.find(params, function(err, volumes) {
            if (err) {
                reject(err);
            } else {
                resolve(volumes);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        let params = {
            collection: 'issues',
            query: {'detailed': {'$not': /[Y]/}}
        };
        db.find(params, function(err, issues) {
            if (err) {
                reject(err);
            } else {
                resolve(issues);
            }
        });
    }));

    promises.push(new Promise(function(resolve, reject) {
        let params = {
            collection: 'story_arcs',
            query: {'detailed': {'$not': /[Y]/}}
        };
        db.find(params, function(err, storyArcs) {
            if (err) {
                reject(err);
            } else {
                resolve(storyArcs);
            }
        });
    }));

    Promise.all(promises).then(function(results) {
        for (let i = 0; i < results[0].length; i++) {
            requestQueue.enqueue('volume-' + results[0][i].id, 1, function(resolve, reject) {
                detailVolume(results[0][i].api_detail_url, function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(null);
                });
            });
        }
        for (let i = 0; i < results[1].length; i++) {
            requestQueue.enqueue('issue-' + results[1][i].id, 3, function(resolve, reject) {
                detailIssue(results[1][i].api_detail_url, function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(null);
                });
            });
        }
        for (let i = 0; i < results[2].length; i++) {
            requestQueue.enqueue('story_arc-' + results[2][i].id, 2, function(resolve, reject) {
                detailStoryArc(results[2][i].api_detail_url, function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(null);
                });
            });
        }
    });
}

function detailVolume(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'characters', 'locations', 'people', 'publisher']
    };
    api.apiRequest(params, function(err, volume) {
        if (err) {
            return cb(err);
        }

        volume.detailed = 'Y';

        let options = {
            collection: 'volumes',
            query: {id: volume.id},
            update: volume
        };

        db.update(options, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null);
        });
    });
}

function detailIssue(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'character_credits', 'story_arc_credits', 'location_credits', 'person_credits']
    };
    api.apiRequest(params, function(err, issue) {
        if (err) {
            return cb(err);
        }

        if (issue.story_arc_credits.story_arc) {
            addStoryArc(issue.story_arc_credits.story_arc, function(err, res) {
                if (err) {
                    return err;
                }
            });
        }

        issue.detailed = 'Y';

        let options = {
            collection: 'issues',
            query: {id: issue.id},
            update: issue
        };
        db.update(options, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null);
        });
    });
}

function detailStoryArc(url, cb) {
    let params = {
        url: url,
        fieldList: ['id', 'deck', 'image', 'issues', 'publisher']
    };
    api.apiRequest(params, function(err, storyArc) {
        if (err) {
            return cb(err);
        }

        storyArc.detailed = 'Y';

        let options = {
            collection: 'story_arcs',
            query: {id: storyArc.id},
            update: storyArc
        };
        db.update(options, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null);
        });
    });
}

function addStoryArc(storyArc, cb) {
    findStoryArc({id: storyArc.id}, function(err, res) {
        if (err) {
            return cb(err);
        }
        if (res.length) {
            return cb(null, res[0]);
        }

        storyArc.detailed = 'N';

        let params = {
            collection: 'story_arcs',
            identifier: {id: storyArc.id},
            document: storyArc
        };
        db.replace(params, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}

function findStoryArc(query, cb) {
    let params = {
        collection: 'story_arcs',
        query: query
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}
