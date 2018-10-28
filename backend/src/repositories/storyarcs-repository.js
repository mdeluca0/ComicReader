const db = require('../db');

function find(query, sort, filter, cb) {
    let params = {
        collection: 'story_arcs',
        query: query,
        sort: sort,
        filter: filter
    };
    db.find(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsert(query, document, cb) {
    let params = {
        collection: 'story_arcs',
        query: query,
        document: document
    };
    db.upsert(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.find = find;
module.exports.upsert = upsert;