const mongo = require('mongodb').MongoClient;
const url = require('./consts').dbUrl;

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

module.exports.find = find;
module.exports.replace = replace;