var mongo = require('mongodb').MongoClient;
var url = require('./consts').dbUrl;

function getVolumes(cb) {
    mongo.connect(url, function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('volumes').find().sort({'name': 1}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        })
    });
}

function getVolume(volumeId, cb) {
    if (!volumeId) {
        return cb('volumeId not supplied');
    }

    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('volumes').find({'id': volumeId}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                res = res.shift();
                return cb(null, res);
            }
        });
    });
}

function getVolumeByNameAndYear(name, year, cb) {
    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('volumes').find({'name': name, 'start_year': year}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}

function getIssues(cb) {
    mongo.connect(url, function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find().sort({'issue_number': 1}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        })
    });
}

function getIssue(issueId, cb) {
    if (!issueId) {
        return cb('issueId not supplied');
    }

    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find({'id': issueId}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else if (typeof(res) === 'undefined') {
                return cb(null, {});
            } else {
                res = res.shift();
                return cb(null, res);
            }
        });
    });
}

function getIssuesByVolume(volumeId, cb) {
    if (!volumeId) {
        return cb('volumeId not supplied');
    }

    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find({'volume.id': volumeId}).sort({'issue_number': 1}).toArray(function (err, res) {
            client.close();
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}

function upsertVolume(document) {
    mongo.connect(url, function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('volumes').replaceOne({id: document.id}, document, {upsert: true}, function(err, res) {
            client.close();
            if (err) {
                return cb(err);
            }
        });
    });
}

function upsertIssue(document) {
    mongo.connect(url, function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').replaceOne({id: document.id}, document, {upsert: true}, function(err, res) {
            client.close();
            if (err) {
               return cb(err);
            }
        });
    });
}

function getUndetailedIssues(cb) {
    mongo.connect(url, function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection('issues').find({'detailed': {'$not': /[Y]/}}).toArray(function (err, res) {
            client.close();
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

module.exports.getVolumes = getVolumes;
module.exports.getVolume = getVolume;
module.exports.getVolumeByNameAndYear = getVolumeByNameAndYear;
module.exports.getIssues = getIssues;
module.exports.getIssue = getIssue;
module.exports.getIssuesByVolume = getIssuesByVolume;
module.exports.upsertVolume = upsertVolume;
module.exports.upsertIssue = upsertIssue;
module.exports.getUndetailedIssues = getUndetailedIssues;