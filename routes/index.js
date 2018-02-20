var express = require('express');
var router = express.Router();

var db = require('../db');
var archive = require('../archive');

// Initialize metadata refresher
require('../DataManager').startRefresh(true);

router.get('/volumes', function(req, res) {
    var volumeIds = req.query.id;

    if (typeof(req.query.id) !== 'undefined') {
        volumeIds = req.query.id.split(',');
    }

    db.getActiveVolumes(volumeIds, function(volumes) {
        res.send(volumes);
    });
});
router.get('/issues', function(req, res) {
    var issueIds = req.query.id;

    if (typeof(req.query.id) !== 'undefined') {
        issueIds = req.query.id.split(',');
    }

    db.getActiveIssues(issueIds, function(issues) {
        res.send(issues);
    });
});
router.get('/page', function(req, res) {
    var issueId = [req.query.id];
    var pageNo = req.query.page;
    db.getActiveIssues(issueId, function(issue) {
        if (issue.length > 0) {
            issue = issue[0];
            archive.extractIssue(issue.issues.file_path, function (err, handler, entries, ext) {
                archive.getPage(handler, entries, ext, pageNo, function (base64Img) {
                    var result = {
                        'volumeName': issue.name,
                        'volumeId': issue.id,
                        'issueName': issue.issues.name,
                        'issueId': issue.issues.id,
                        'pageCount': issue.issues.page_count,
                        'pageImage': base64Img
                    };
                    res.send(result);
                });
            });
        } else {
            res.send({});
        }
    });
});

module.exports = router;