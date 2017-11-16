var mongo = require('mongodb').MongoClient;
var url = require('./consts').dbUrl;

// Get's every volume that has active issues in it
function getActive (cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').aggregate([
            {$unwind: '$issues'},
            {$match: {'issues.active': 'Y'}},
            {$group: {
                '_id': '$_id',
                'count_of_issues': {'$first': '$count_of_issues'},
                'id': {'$first': '$id'},
                'image': {'$first': '$image'},
                'name': {'$first': '$name'},
                'start_year': {'$first': '$start_year'},
                'issues': {'$push': '$issues'}
            }},
            {$sort: {'name': 1}}
        ], function (err, res) {
            db.close();
            return cb(res);
        });
    });
}

// Gets every volume in the database regardless of active status
function getAllVolumes (cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').find().toArray(function (err, res) {
            db.close();
            return cb(res);
        })
    });
}

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

// Gets a volume by its id
function getVolume (volumeId, cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').aggregate([
            {$match: {'id' : volumeId}},
            {$unwind: '$issues'},
            {$match: {'issues.active': 'Y'}},
            {$group: {
                '_id': '$_id',
                'count_of_issues': {'$first': '$count_of_issues'},
                'id': {'$first': '$id'},
                'image': {'$first': '$image'},
                'name': {'$first': '$name'},
                'start_year': {'$first': '$start_year'},
                'issues': {'$push': '$issues'}
            }}
        ], function (err, res) {
            db.close();
            return cb(res);
        });
    });
}

// Gets an issue by its id
function getIssue (issueId, cb) {
    mongo.connect(url, function(err, db) {
        db.collection('volumes').aggregate([
            {$unwind: '$issues'},
            {$match: {'issues.id': issueId}}
        ], function(err, res) {
            var issue = res[0].issues;
            issue.volumeId = res[0].id;
            issue.volumeName = res[0].name;
            issue.startYear = res[0].start_year;
            db.close();
            return cb(issue);
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

module.exports.getActive = getActive;
module.exports.getAllVolumes = getAllVolumes;
module.exports.getAllIssues = getAllIssues;
module.exports.getVolume = getVolume;
module.exports.getIssue = getIssue;
module.exports.upsertVolume = upsertVolume;
module.exports.updateIssues = updateIssues;