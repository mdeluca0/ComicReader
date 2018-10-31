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

function findIssues(query, cb) {
    let agg = [];
    agg.push({$match: query});
    agg.push({
        $project: {
            id: 1
        }
    });
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
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    "$name",
                                    "$$name"
                                ]
                            },
                            {
                                $eq: [
                                    "$start_year",
                                    "$$start_year"
                                ]
                            }
                        ]
                    }
                }
            }],
            as: "volume"
        }
    });
    agg.push({
        $project: {
            '_id': 1,
            'issue_number': 1,
            'name': 1,
            'cover': 1,
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
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    "$name",
                                    "$$name"
                                ]
                            },
                            {
                                $eq: [
                                    "$start_year",
                                    "$$start_year"
                                ]
                            }
                        ]
                    }
                }
            }],
            as: "volumeFile"
        }
    });
    agg.push({
        $project: {
            '_id': 1,
            'issue_number': 1,
            'name': 1,
            'cover': 1,
            'volume': 1,
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
        $project: {
            '_id': 1,
            'issue_number': 1,
            'name': 1,
            'cover': 1,
            'volume.id': 1,
            'file':
                { $arrayElemAt: [
                    { $filter: {
                        input: "$issueFile",
                        as: "item",
                        cond: {$eq: ["$$item.issue_number", "$issue_number"]}
                    }}, 0]
                }
        }
    });

    db.aggregate({collection: 'story_arcs', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.find = find;
module.exports.upsert = upsert;
module.exports.findIssues = findIssues;