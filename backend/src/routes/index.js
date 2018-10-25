const express = require('express');
const router = express.Router();
const db = require('../db');
const archive = require('../archive');
const repo = require('../repository');

const volumePageSize = 50;
const issuePageSize = 50;

router.get('/volumes', function(req, res) {
    let offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    let query = {parent: null};
    let sort = {name: 1};
    let filter = {id: 1, name: 1, start_year: 1, cover: 1};

    repo.findVolumes(query, sort, filter, function(err, volumes) {
        if (err) {
            //TODO: send error response
            return err;
        }

        volumes = {
            volumes: volumes.slice(offset, offset+volumePageSize)
        };

        res.send(volumes);
    });
});

router.get('/volumes/:volumeId', function(req, res) {
    let query = {_id: db.convertId(req.params.volumeId)};
    let filter = {id: 1, description: 1, name: 1, start_year: 1, cover: 1, 'publisher.name': 1};

    repo.findVolumes(query, {}, filter, function(err, volume) {
        if (err) {
            //TODO: send error response
            return err;
        }
        res.send(volume);
    });
});

router.get('/volumes/:volumeId/issues', function(req, res) {
    let offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    let query = {parent: db.convertId(req.params.volumeId)};
    let sort = {issue_number: 1};
    let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};

    repo.findIssues(query, sort, filter, function(err, issues) {
        if (err) {
            //TODO: send error
        }

        issues = {
            issues: issues.slice(offset, offset+issuePageSize)
        };

        res.send(issues);
    });
});

router.get('/issues', function(req, res) {
    let offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    let query = {parent: {$ne: null}};
    let sort = {'volume.name': 1, issue_number: 1};
    let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};

    repo.findIssues(query, sort, filter, function(err, issues) {
        if (err) {
            //TODO: send error response
        }

        issues = {
            issues: issues.slice(offset, offset+issuePageSize)
        };

        res.send(issues);
    });
});

router.get('/issues/:issueId', function(req, res) {
    let query = {_id: db.convertId(req.params.issueId)};

    repo.findIssues(query, {}, {}, function(err, issue) {
        if (err) {
            //TODO: send error response
        }

        issue[0].nextIssue = {};
        issue[0].prevIssue = {};

        if (!issue.length) {
            res.send(issue);
            return;
        }

        const nextIssueNum = issue[0].issue_number + 1;
        const prevIssueNum = issue[0].issue_number - 1;
        let query = {$or: [
            {parent: issue[0].parent, issue_number: nextIssueNum},
            {parent: issue[0].parent, issue_number: prevIssueNum}
        ]};
        let filter = {name: 1, issue_number: 1, cover: 1};

        repo.findIssues(query, {}, filter, function(err, issues) {
            if (err) {
                res.send(issue);
                return err;
            }

            for (let i = 0; i < issues.length; i++) {
                let issueInfo = {
                    _id: issues[i]._id.toString(),
                    name: issues[i].metadata.name || '',
                    issue_number: issues[i].issue_number
                };
                if (issues[i].issue_number === nextIssueNum) {
                    issue[0].nextIssue = issueInfo;
                } else if (issues[i].issue_number === prevIssueNum) {
                    issue[0].prevIssue = issueInfo;
                }
            }

            res.send(issue);
        });

    });
});

router.get('/issues/:issueId/page_count', function(req, res) {
    let query = {_id: db.convertId(req.params.issueId)}

    repo.findIssues(query, {}, {}, function(err, issue) {
        if (err) {
            //todo: send error response
            return;
        }
        if (!issue.length) {
            //todo: send error response
            return;
        }

        issue = issue.shift();

        let path = issue.file;

        if (issue.volume.file) {
            path = issue.volume.file + '/' + path;
        }

        archive.extractIssue(path, function (err, handler, entries) {
            if (err) {
                //todo: send error response
                return;
            }
            archive.getPageCount(entries, function (err, count) {
                if (err) {
                    //todo: send error response
                    return;
                }
                res.send({page_count: count});
            });
        });
    });
});

router.get('/issues/:issueId/:pageNo', function(req, res) {
    let query = {_id: db.convertId(req.params.issueId)}
    let pageNo = req.params.pageNo;

    if (isNaN(parseInt(pageNo))) {
        //todo: send error response
        return;
    }

    repo.findIssues(query, {}, {}, function(err, issue) {
        if (err) {
            //todo: send error response
        }
        if (!issue.length) {
            //todo: send error response
            return;
        }

        issue = issue.shift();

        let path = issue.file;

        if (issue.volume.file) {
            path = issue.volume.file + '/' + path;
        }

        archive.extractIssue(path, function (err, handler, entries, ext) {
            if (err) {
                //todo: send error response
            }
            archive.getPage(handler, entries, ext, pageNo, function (err, base64Img) {
                if (err) {
                    //todo: send error response
                }
                res.send({
                    pageNo: pageNo,
                    image: base64Img
                });
            });
        });
    });
});

router.get('/results', function(req, res) {
    /*var searchQuery = "";
    if (req.query.search_query) {
        searchQuery = req.query.search_query.toString();
    } else {
        //TODO: send reject
    }

    var volumesPromise = new Promise(function(resolve, reject) {
        var params = {
            collection: 'volumes',
            query: { $text: { $search: searchQuery } }
        };
        db.find(params, function(err, volumes) {
            if (err) {
                reject(err);
            } else {
                resolve({volumes: volumes});
            }
        });
    });

    var issuesPromise = new Promise(function(resolve, reject) {
        var params = {
            collection: 'issues',
            query: { $text: { $search: searchQuery } }
        };
        db.find(params, function(err, issues) {
            if (err) {
                reject(err);
            } else {
                resolve({issues: issues});
            }
        });
    });

    Promise.all([volumesPromise, issuesPromise]).then(function(results) {
        let resultsMerge = {};
        results.forEach(function(promise) {
           Object.assign(resultsMerge, promise);
        });
        res.send(resultsMerge);
    });*/
});

module.exports = router;