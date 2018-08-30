var express = require('express');
var router = express.Router();

var db = require('../db');
var archive = require('../archive');
var monitor = require('../monitor');

// Tests
//require('../tests/test').test();


router.get('/volumes', function(req, res) {
    db.getVolumes(null, function(err, volumes) {
        if (err) {
            return err;
        }
        res.send(volumes);
    });
});

router.get('/volumes/:volumeId', function(req, res) {
    var volumeId = req.params.volumeId;

    db.getVolume(volumeId, function(err, volume) {
        if (err) {
            return err;
        }
        res.send(volume);
    });
});

router.get('/volumes/:volumeId/issues', function(req, res) {
    var volumeId = req.params.volumeId;

    db.getIssuesByVolume(volumeId, function(err, issues) {
        if (err) {
            return err;
        }
        res.send(issues);
    });
});

router.get('/issues', function(req, res) {
    db.getIssues(function(err, issues) {
        if (err) {
            return err;
        }
        res.send(issues);
    });
});

router.get('/issues/:issueId', function(req, res) {
    var issueId = req.params.issueId;

    db.getIssue(issueId, function(err, issue) {
        if (err) {
            return err;
        }
        res.send(issue);
    });
});

router.get('/volumes/:volumeId/issues/:issueId/:pageNo', function(req, res) {
    var volumeId = req.params.volumeId;
    var issueId = req.params.issueId;
    var pageNo = req.params.pageNo;

    db.getIssue(volumeId, issueId, function(err, issue) {
        if (err) {
            return err;
        }
        archive.extractIssue(issue.issues.file_path, function (err, handler, entries, ext) {
            if (err) {
                return err;
            }
            archive.getPage(handler, entries, ext, pageNo, function (err, base64Img) {
                if (err) {
                    return err;
                }
                res.send(base64Img);
            });
        });

    });
});

module.exports = router;