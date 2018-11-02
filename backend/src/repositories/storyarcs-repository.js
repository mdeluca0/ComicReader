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

function search(query, sort, filter, cb) {
    let agg = [];
    agg.push({$match: query});
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

    db.aggregate({collection: 'story_arcs', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function findIssues(query, sort, filter, cb) {
    let agg = [];
    agg.push({$match: query});
    agg.push({
        $lookup: {
            from: "issues",
            localField: "id",
            foreignField: "story_arc_credits.story_arc.id",
            as: "issue"
        }
    });
    agg.push({
        $project: {
            issue: 1
        }
    });
    agg.push({
        $unwind: "$issue"
    });
    agg.push({
       $replaceRoot: {newRoot: '$issue'}
    });
    agg.push({
        $lookup: {
            from: "volumes",
            let: {
                name: "$volume.name",
                start_year: "$volume.start_year"
            },
            pipeline: [{
                $match: {$expr: {$and: [
                    {$eq: ["$name", "$$name"]},
                    {$eq: ["$start_year", "$$start_year"]}
                ]}}
            }],
            as: "volume"
        }
    });
    agg.push({
        $addFields: {
            'volume': {$arrayElemAt: ["$volume", 0]}
        }
    });
    agg.push({
        $lookup: {
            from: "directory",
            let: {
                name: "$volume.name",
                start_year: "$volume.start_year"
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
        $addFields: {
            'volumeFile': {$arrayElemAt: ["$volumeFile", 0]}
        }
    });
    agg.push({
        $lookup: {
            from: "directory",
            localField: "volumeFile._id",
            foreignField: "parent",
            as: "issueFile"
        }
    });
    agg.push({
        $addFields: {
            'issueFile':
                { $arrayElemAt: [
                    { $filter: {
                        input: "$issueFile",
                        as: "item",
                        cond: {$eq: ["$$item.issue_number", "$issue_number"]}
                    }}, 0]
                }
        }
    });
    if (sort && Object.keys(sort).length > 0) {
        agg.push({$sort: sort});
    }
    if (filter && Object.keys(filter).length > 0) {
        agg.push({
            $project: Object.assign({
                issueFile: 1
            }, filter)
        });
    }

    db.aggregate({collection: 'story_arcs', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.find = find;
module.exports.upsert = upsert;
module.exports.search = search;
module.exports.findIssues = findIssues;