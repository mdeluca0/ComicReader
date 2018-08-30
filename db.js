var mongo = require('mongodb').MongoClient;
var url = require('./consts').dbUrl;

// Gets every volume in the database regardless of active status
function getAllVolumes (cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').find().toArray(function (err, res) {
            db.close();
            return cb(res);
        })
    });
}

// Gets every issue in the database regardless of active status
function getAllIssues (cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').aggregate([
            {$unwind: '$issues'}
        ], function (err, res) {
            db.close();
            return cb(res);
        })
    });
}

// Gets every active volume
function getActiveVolumes(cb) {
    var aggregation = [];

    aggregation.push({$unwind: '$issues'});
    aggregation.push({$match:  {'issues.active': 'Y'}});
    aggregation.push(
        {$group: {
            '_id': '$_id',
            'characters': {'$first': '$characters'},
            'locations': {'$first': '$locations'},
            'people': {'$first': '$people'},
            'publisher': {'$first': '$publisher'},
            'count_of_issues': {'$first': '$count_of_issues'},
            'description': {'$first': '$description'},
            'id': {'$first': '$id'},
            'name': {'$first': '$name'},
            'start_year': {'$first': '$start_year'},
            'cover': {'$first': '$cover'},
            'issues': {'$push': '$issues'}
        }}
    );
    aggregation.push({$sort: {'name': 1}});

    mongo.connect(url, function (err, db) {
        db.collection('volumes').aggregate(aggregation, function (err, res) {
            db.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                return cb(null, res);
            }
        });
    });
}

// Gets an active volume
function getActiveVolume(id, cb) {
    if (!id) {
        return cb(1);
    }

    var aggregation = [];

    aggregation.push({$unwind: '$issues'});
    aggregation.push({$match: {'id': {$in: id}}});
    aggregation.push({$match:  {'issues.active': 'Y'}});
    aggregation.push(
        {$group: {
                '_id': '$_id',
                'characters': {'$first': '$characters'},
                'locations': {'$first': '$locations'},
                'people': {'$first': '$people'},
                'publisher': {'$first': '$publisher'},
                'count_of_issues': {'$first': '$count_of_issues'},
                'description': {'$first': '$description'},
                'id': {'$first': '$id'},
                'name': {'$first': '$name'},
                'start_year': {'$first': '$start_year'},
                'cover': {'$first': '$cover'},
                'issues': {'$push': '$issues'}
            }}
    );
    aggregation.push({$sort: {'name': 1}});

    mongo.connect(url, function (err, db) {
        db.collection('volumes').aggregate(aggregation, function (err, res) {
            db.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                return cb(null, res);
            }
        });
    });
}

// Gets every active issue listed in issueIds or every active issue if issueIds is empty
function getActiveIssues (volumeId, cb) {
    var aggregation = [];

    aggregation.push({$match:  {'id': volumeId}});
    aggregation.push({$unwind: '$issues'});
    aggregation.push({$match:  {'issues.active': 'Y'}});

    mongo.connect(url, function (err, db) {
        db.collection('volumes').aggregate(aggregation, function (err, res) {
            db.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                return cb(null, res);
            }
        });
    });
}

function getActiveIssue(volumeId, issueId, cb) {
    var aggregation = [];

    aggregation.push({$match:  {'id': volumeId}});
    aggregation.push({$unwind: '$issues'});
    aggregation.push({$match: {'issues.id': {$in: issueId}}});
    aggregation.push({$match: {'issues.active': 'Y'}});

    mongo.connect(url, function (err, db) {
        db.collection('volumes').aggregate(aggregation, function (err, res) {
            db.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                return cb(null, res);
            }
        });
    });
}

function upsertVolume (document) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').replaceOne({id: document.id}, document, {upsert: true}, function(err, res) {
            db.close();
        });
    });
}

function updateIssues (volumeId, issues) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').update({id: volumeId}, {$set: {'issues': issues}}, function(err, res) {
            db.close();
        });
    });
}

function detailIssue (volumeId, issueId, details) {

}

module.exports.getAllVolumes = getAllVolumes;
module.exports.getAllIssues = getAllIssues;
module.exports.getActiveVolumes = getActiveVolumes;
module.exports.getActiveVolume = getActiveVolume;
module.exports.getActiveIssues = getActiveIssues;
module.exports.getActiveIssue = getActiveIssue;
module.exports.upsertVolume = upsertVolume;
module.exports.updateIssues = updateIssues;
module.exports.detailIssue = detailIssue;