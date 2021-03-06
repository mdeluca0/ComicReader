const db = require('../db');
const config = require('../config');

function find(query, sort, filter, offset, cb) {
    let params = {
        collection: 'directory',
        query: query,
        sort: sort,
        filter: filter,
        offset: offset
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
        collection: 'directory',
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

function remove(query, cb) {
    let params = {
        collection: 'directory',
        query: query
    };
    db.remove(params, function (err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function findVolumesWithMeta(query, sort, filter, offset, cb) {
    let agg = [];
    agg.push({$match: query});
    agg.push({
        $lookup: {
            from: "volumes",
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
            as: "metadata"
        }
    });
    agg.push({
        $addFields: {
            metadata: {$arrayElemAt: ["$metadata", 0]}
        }
    });
    if (sort && Object.keys(sort).length > 0) {
        agg.push({$sort: sort});
    }
    if (filter && Object.keys(filter).length > 0) {
        filter = Object.keys(filter).map(key => {
            const newKey = 'metadata.' + key;
            return { [newKey]: filter[key] };
        });
        filter = Object.assign({}, ...filter);
        agg.push({
            $project: Object.assign({
                name: 1,
                start_year: 1,
                file: 1
            }, filter)
        });
    }
    if (offset !== null) {
        agg.push({$skip: offset});
        agg.push({$limit: config.responseLimit});
    }

    db.aggregate({collection: 'directory', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function findIssuesWithMeta(query, sort, filter, offset, cb) {
    let agg = [];
    agg.push({$match: query});
    agg.push({
        $lookup: {
            from: "directory",
            localField: "parent",
            foreignField: "_id",
            as: "volume"
        }
    });
    agg.push({
        $addFields: {
            volume: { $arrayElemAt: [ "$volume", 0 ] }
        }
    });
    agg.push({
        $lookup: {
            from: "issues",
            let: {
                name: "$volume.name",
                start_year: "$volume.start_year",
                issue_number: "$issue_number"
            },
            pipeline: [{
                $match: {$expr: {$and: [
                    {$eq: ["$volume.name", "$$name"]},
                    {$eq: ["$volume.start_year", "$$start_year"]},
                    {$eq: ["$issue_number", "$$issue_number"]}]
                }}
            }],
            as: "metadata"
        }
    });
    agg.push({
        $addFields: {
            metadata: {$arrayElemAt: ["$metadata", 0]}
        }
    });
    if (sort && Object.keys(sort).length > 0) {
        agg.push({$sort: sort});
    }
    if (filter && Object.keys(filter).length > 0) {
        filter = Object.keys(filter).map(key => {
            const newKey = 'metadata.' + key;
            return { [newKey]: filter[key] };
        });
        filter = Object.assign({}, ...filter);
        agg.push({
            $project: Object.assign({
                file: 1,
                issue_number: 1,
                parent: 1,
                volume: 1
            }, filter)
        });
    }
    if (offset !== null) {
        agg.push({$skip: offset});
        agg.push({$limit: config.responseLimit});
    }

    db.aggregate({collection: 'directory', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.find = find;
module.exports.upsert = upsert;
module.exports.remove = remove;
module.exports.findVolumesWithMeta = findVolumesWithMeta;
module.exports.findIssuesWithMeta = findIssuesWithMeta;