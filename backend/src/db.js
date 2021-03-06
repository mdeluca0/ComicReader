const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const config = require('./config');

var client = null;

function convertId(id) {
    try {
        return new ObjectId(id.toString());
    } catch (err) {
        return null;
    }
}

function connect(cb) {
    if (client == null) {
        mongo.connect(config.dbUrl, {useNewUrlParser: true}, function (err, c) {
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

        let db = client.db('main');

        let q = db.collection(options.collection);

        options.query = options.query || {};
        options.filter = options.filter || {};
        options.sort = options.sort || {};
        options.offset = options.offset || null;

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

        // Offset
        if (options.offset !== null) {
            q = q.skip(parseInt(options.offset));
            q = q.limit(config.responseLimit);
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

function upsert(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        let db = client.db('main');

        db.collection(options.collection).updateMany(
            options.query,
            {$set: options.document},
            {multi: true, upsert: true},
            function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, res);
            }
        );
    });
}

function remove(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        let db = client.db('main');

        db.collection(options.collection).deleteMany(options.query, function(err) {
            if (err) {
                return cb(err);
            }
            return cb(null, null);
        });
    });
}

function aggregate(options, cb) {
    connect(function(err, client) {
        if (err) {
            return cb(err);
        }

        let db = client.db('main');

        db.collection(options.collection).aggregate(options.aggregation, function(err, res) {
            if (err) {
                return cb(err);
            }
            res.toArray(function (err, res) {
                if (err) {
                    return cb(err);
                } else {
                    return cb(null, res);
                }
            });
        });
    });
}

module.exports.convertId = convertId;
module.exports.find = find;
module.exports.upsert = upsert;
module.exports.remove = remove;
module.exports.aggregate = aggregate;