const express = require('express');
const router = express.Router();
const db = require('../db');
const archive = require('../archive');

const volumePageSize = 50;
const issuePageSize = 50;

router.get('/volumes', function(req, res) {
    var offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    var params = {
        collection: 'volumes',
        sort: {'name': 1}
    };

    db.find(params, function(err, volumes) {
        if (err) {
            return err;
        }

        volumes = {
            volumes: volumes.slice(offset, offset+volumePageSize)
        };

        res.send(volumes);
    });
});

router.get('/volumes/:volumeId', function(req, res) {
    var params = {
        collection: 'volumes',
        query: {'id': req.params.volumeId}
    };
    db.find(params, function(err, volume) {
        if (err) {
            return err;
        }
        res.send(volume);
    });
});

router.get('/volumes/:volumeId/issues', function(req, res) {
    var offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    var params = {
        collection: 'issues',
        query: {'active': 'Y', 'volume.id': req.params.volumeId},
        sort: {'issue_number': 1}
    };
    db.find(params, function(err, issues) {
        if (err) {
            return err;
        }

        issues = {
            issues: issues.slice(offset, offset+issuePageSize)
        };

        res.send(issues);
    });
});

router.get('/issues', function(req, res) {
    var offset = 0;
    if (req.query.offset) {
        offset = parseInt(req.query.offset);
    }

    var params = {
        collection: 'issues',
        sort: {'issue_number': 1}
    };
    db.find(params, function(err, issues) {
        if (err) {
            return err;
        }

        issues = {
            issues: issues.slice(offset, offset+issuePageSize)
        };

        res.send(issues);
    });
});

router.get('/issues/:issueId', function(req, res) {
    var params = {
        collection: 'issues',
        query: {'id': req.params.issueId}
    };
    db.find(params, function(err, issue) {
        if (err) {
            return err;
        }

        issue[0].nextIssue = {};
        issue[0].prevIssue = {};

        if (!issue.length) {
            res.send(issue);
            return;
        }

        const nextIssueNum = issue[0].issue_number + 1;
        const prevIssueNum = issue[0].issue_number - 1;
        params.query = {$or: [
            {'volume.id': issue[0].volume.id, issue_number: nextIssueNum},
            {'volume.id': issue[0].volume.id, issue_number: prevIssueNum}
        ]};

        db.find(params, function(err, issues) {
            if (err) {
                res.send(issue);
                return err;
            }

            for (let i = 0; i < issues.length; i++) {
                let issueInfo = {
                    id: issues[i].id,
                    name: issues[i].name,
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

router.get('/issues/:issueId/:pageNo', function(req, res) {
    var params = {
        collection: 'issues',
        query: {'id': req.params.issueId}
    };
    var pageNo = req.params.pageNo;

    db.find(params, function(err, issue) {
        if (err) {
            return err;
        }
        archive.extractIssue(issue[0].file_path, function (err, handler, entries, ext) {
            if (err) {
                return err;
            }
            archive.getPage(handler, entries, ext, pageNo, function (err, base64Img) {
                if (err) {
                    return err;
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
    var searchQuery = "";
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
        res.send(results);
    });
});

module.exports = router;