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

// Gets every active volume listed in volumeIds or every active volume if volumeIds is empty
function getActiveVolumes (volumeIds, cb) {
    var aggregation = [];

    aggregation.push({$unwind: '$issues'});

    if (typeof(volumeIds) !== 'undefined') {
        aggregation.push({$match: {'id': {$in: volumeIds}}});
    }

    aggregation.push({$match:  {'issues.active': 'Y'}});

    aggregation.push(
        {$group: {
            '_id': '$_id',
            'count_of_issues': {'$first': '$count_of_issues'},
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
            if (typeof(res) === 'undefined') {
                return [];
            } else {
                return cb(res);
            }
        });
    });
}

// Gets every active issue listed in issueIds or every active issue if issueIds is empty
function getActiveIssues (issueIds, cb) {
    var aggregation = [];

    aggregation.push({$unwind: '$issues'});

    if (typeof(issueIds) !== 'undefined') {
        aggregation.push({$match: {'issues.id': {$in: issueIds}}});
    }

    aggregation.push({$match:  {'issues.active': 'Y'}});

    mongo.connect(url, function (err, db) {
        db.collection('volumes').aggregate(aggregation, function (err, res) {
            db.close();
            if (typeof(res) === 'undefined') {
                return [];
            } else {
                return cb(res);
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

module.exports.getAllVolumes = getAllVolumes;
module.exports.getAllIssues = getAllIssues;
module.exports.getActiveVolumes = getActiveVolumes;
module.exports.getActiveIssues = getActiveIssues;
module.exports.upsertVolume = upsertVolume;
module.exports.updateIssues = updateIssues;