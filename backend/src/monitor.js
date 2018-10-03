const db = require('./db');
const api = require('./api');
const priorityQueue = require('./priorityqueue').PriorityQueue;

var requestQueue = new priorityQueue();
var populating = false;

setInterval(function () {
    if (!requestQueue.isEmpty()) {
        let item = requestQueue.dequeue();
        item = item.item;

        switch(item.type) {
            case 'volume':
                console.log('Requesting Volume: ' + item.id);
                detailVolume(item.id, item.url, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Updated Volume: ' + item.id);
                    }
                });
                break;
            case 'issue':
                console.log('Requesting Issue: ' + item.id);
                detailIssue(item.id, item.url, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Updated Issue: ' + item.id);
                    }
                });
                break;
            case 'story_arc':
                break;
            default:
                break;
        }
    } else if (!populating) {
        populateRequestQueue();
    }
}, 1000);

function populateRequestQueue() {
    populating = true;

    var volumesPromise = new Promise(function(resolve, reject) {
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
    });

    var issuesPromise = new Promise(function(resolve, reject) {
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
    });

    //TODO: add story arc promise

    Promise.all([volumesPromise, issuesPromise]).then(function(results) {
        for (let i = 0; i < results[0].length; i++) {
            requestQueue.enqueue({
                type: 'volume',
                id: results[0][i].id,
                url: results[0][i].api_detail_url
            }, 1);
        }
        for (let i = 0; i < results[1].length; i++) {
            requestQueue.enqueue({
                type: 'issue',
                id: results[1][i].id,
                url: results[1][i].api_detail_url
            }, 3);
        }
        populating = false;
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

function detailStoryArc(id, url, cb) {

}

