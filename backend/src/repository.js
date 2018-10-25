const db = require('./db');

function findVolumes(query, sort, filter, cb) {
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
            as: "metadata"
        }
    });
    agg.push({
        $project: {
            name: 1,
            start_year: 1,
            file: 1,
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

    db.aggregate({collection: 'directory', aggregation: agg}, function(err, res) {
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
            from: "directory",
            localField: "parent",
            foreignField: "_id",
            as: "volume"
        }
    });
    agg.push({
        $project: {
            file: 1,
            issue_number: 1,
            parent: 1,
            volume: { $arrayElemAt: [ "$volume", 0 ] }
    }});
    agg.push({
        $lookup: {
            from: "issues",
            let: {
                name: "$volume.name",
                start_year: "$volume.start_year",
                issue_number: "$issue_number"
            },
            pipeline: [{
                $match: {
                    $expr: {
                        $and: [{
                            $eq: [
                                "$volume.name",
                                "$$name"
                            ]
                        },
                        {
                            $eq: [
                                "$volume.start_year",
                                "$$start_year"
                            ]
                        },
                        {
                            $eq: [
                                "$issue_number",
                                "$$issue_number"
                            ]
                        }]
                    }
                }
            }],
            as: "metadata"
        }
    });
    agg.push({
        $project: {
            file: 1,
            issue_number: 1,
            parent: 1,
            volume: 1,
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

    db.aggregate({collection: 'directory', aggregation: agg}, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.findVolumes = findVolumes;
module.exports.findIssues = findIssues;