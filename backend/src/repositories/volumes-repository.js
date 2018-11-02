const db = require('../db');

function find(query, sort, filter, cb) {
    let params = {
        collection: 'volumes',
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
        collection: 'volumes',
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

function search(query, sort, filter, cb) {
    let agg = [];
    agg.push({$match: query});
    agg.push({
        $lookup: {
            from: "directory",
            let: {
                name: "$name",
                start_year: "$start_year"
            },
            pipeline: [{
                $match: {$expr: {$and: [
                    {$eq: ["$name", "$$name"]},
                    {$eq: ["$start_year", "$$start_year"]}
                ]}}
            }],
            as: "volumeFile"
        }
    });
    agg.push({
        $addFields: {"volumeFile": { $arrayElemAt: [ "$volumeFile", 0 ] }}
    });
    if (sort && Object.keys(sort).length > 0) {
        agg.push({$sort: sort});
    }
    if (filter && Object.keys(filter).length > 0) {
        agg.push({
            $project: Object.assign({
                volumeFile: 1
            }, filter)
        });
    }

    db.aggregate({collection: 'volumes', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.find = find;
module.exports.upsert = upsert;
module.exports.search = search;