var mongo = require('mongodb').MongoClient;
var url = require('./consts').dbUrl;

function find(options, cb) {
    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        var q = db.collection(options.collection);

        // Find
        if (typeof(options.query) !== 'undefined') {
            q = q.find(options.query);
        } else {
            q = q.find();
        }

        // Sort
        if (typeof(options.sort) !== 'undefined') {
            q = q.sort(options.sort);
        }

        q.toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}

function replace(options, cb) {
    mongo.connect(url, function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection(options.collection).replaceOne(options.identifier, options.document, {upsert: true}, function(err, res) {
            client.close();
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}

function getVolumes(cb) {
    var params = {
        collection: 'volumes',
        sort: {'name': 1}
    };
    find(params, function(err, res) {
       if (err) {
           return cb(err);
       }
       return cb(null, res);
    });
}

function getVolume(volumeId, cb) {
    var params = {
        collection: 'volumes',
        query: {'id': volumeId}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getVolumeByNameAndYear(name, year, cb) {
    var params = {
        collection: 'volumes',
        query: {'name': name, 'start_year': year}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getIssues(cb) {
    var params = {
        collection: 'issues',
        sort: {'issue_number': 1}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getIssue(issueId, cb) {
    var params = {
        collection: 'issues',
        query: {'id': issueId}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getIssuesByVolume(volumeId, cb) {
    var params = {
        collection: 'issues',
        query: {'volume.id': volumeId},
        sort: {'issue_number': 1}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsertVolume(document, cb) {
    var params = {
        collection: 'volumes',
        identifier: {id: document.id},
        document: document
    };
    replace(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsertIssue(document, cb) {
    var params = {
        collection: 'issues',
        identifier: {id: document.id},
        document: document
    };
    replace(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function getUndetailedIssues(cb) {
    var params = {
        collection: 'issues',
        query: {'detailed': {'$not': /[Y]/}}
    };
    find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

/*function getCorruptIssues(cb) {
    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find({'cover': {'$not': /[Y]/}}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}*/

module.exports.getVolumes = getVolumes;
module.exports.getVolume = getVolume;
module.exports.getVolumeByNameAndYear = getVolumeByNameAndYear;
module.exports.getIssues = getIssues;
module.exports.getIssue = getIssue;
module.exports.getIssuesByVolume = getIssuesByVolume;
module.exports.upsertVolume = upsertVolume;
module.exports.upsertIssue = upsertIssue;
module.exports.getUndetailedIssues = getUndetailedIssues;