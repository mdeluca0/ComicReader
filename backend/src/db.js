const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const url = require('./consts').dbUrl;
var client = null;

function connect(cb) {
    if (client == null) {
        mongo.connect(url, {useNewUrlParser: true}, function (err, c) {
            if (err) {
                return cb(err);
            }

            client = c;
            client.on('close', function() {
                client = null;
            });

            setIndices();

            return cb(null, client);
        });
    } else {
        return cb(null, client);
    }
}

function setIndices() {
    client.db('main').collection('directory').createIndex({name: 'text'});
    client.db('main').collection('volumes').createIndex({name: 'text'});
    client.db('main').collection('issues').createIndex({name: 'text'});
    client.db('main').collection('story_arcs').createIndex({name: 'text'});
}

function find(options, cb) {
    connect(function (err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        var q = db.collection(options.collection);

        options.query = options.query || {};
        options.filter = options.filter || {};
        options.sort = options.sort || {};

        if (typeof(options.query._id) !== 'undefined') {
            options.query._id = new ObjectId(options.query._id);
        }

        // Find
        q = q.find(options.query);

        // Filter
        if (options.filter !== {}) {
            q = q.project(options.filter);
        }

        // Sort
        if (options.sort !== {}) {
            q = q.sort(options.sort);
        }

        q.toArray(function (err, res) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, res);
            }
        });
    });
}

function replace(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection(options.collection).replaceOne(options.identifier, options.document, {upsert: true}, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res.upsertedId._id.toString());
        });
    });
}

function update(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection(options.collection).updateOne(options.query, {$set: options.update}, function(err, res) {
            if (err) {
                return cb(err);
            }
            return cb(null, res);
        });
    });
}

function remove(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        var db = client.db('main');

        db.collection(options.collection).deleteMany(options.query, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null);
        });
    });
}

module.exports.find = find;
module.exports.replace = replace;
module.exports.update = update;
module.exports.remove = remove;