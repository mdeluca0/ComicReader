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

    Promise.all(promises).then(function(results) {
        for (let i = 0; i < results[0].length; i++) {
            requestQueue.enqueue('volume-' + results[0][i].id, 1, function(resolve, reject) {
                detailVolume(results[0][i].id, results[0][i].api_detail_url, function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(null);
                });
            });
        }
        for (let i = 0; i < results[1].length; i++) {
            requestQueue.enqueue('issue-' + results[1][i].id, 3, function(resolve, reject) {
                detailIssue(results[1][i].id, results[1][i].api_detail_url, function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(null);
                });
            });
        }
    });
}

function detailVolume(id, url, cb) {
    let params = {
        url: url,
        fieldList: ['characters', 'locations', 'people', 'publisher']
    };
    api.apiRequest(params, function(err, volume) {
        if (err) {
            return cb(err);
        }

        volume.detailed = 'Y';

        let options = {
            collection: 'volumes',
            query: {id: id},
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

function detailIssue(id, url, cb) {
    let params = {
        url: url,
        fieldList: ['character_credits', 'story_arc_credits', 'location_credits', 'person_credits']
    };
    api.apiRequest(params, function(err, issue) {
        if (err) {
            return cb(err);
        }

        issue.detailed = 'Y';

        let options = {
            collection: 'issues',
            query: {id: id},
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

function requestStoryArc(arcId, cb) {
    let params = {
        url: consts.apiUrl + 'story_arc/' + arcId + '/',
        fieldList: ['api_detail_url', 'id', 'deck', 'image', 'issues', 'name', 'publisher']
    };

    api.apiRequest(params, function(err, arc) {
        if (err) {
            return cb(err);
        }
        return cb(null, arc);
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

function addStoryArc(arcId, cb) {
    findStoryArc({id: arcId}, function(err, res) {
        if (err) {
            return cb(err);
        }
        if (res.length) {
            return cb(null, res[0]);
        }
    });
}
