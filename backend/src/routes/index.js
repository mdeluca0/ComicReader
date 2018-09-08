const express = require('express');
const router = express.Router();
const db = require('../db');
const archive = require('../archive');

router.get('/volumes', function(req, res) {
    var params = {
        collection: 'volumes',
        sort: {'name': 1}
    };
    db.find(params, function(err, volumes) {
        if (err) {
            return cb(err);
        }
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
            return cb(err);
        }
        res.send(volume);
    });
});

router.get('/volumes/:volumeId/issues', function(req, res) {
    var params = {
        collection: 'issues',
        query: {'volume.id': req.params.volumeId},
        sort: {'issue_number': 1}
    };
    db.find(params, function(err, issues) {
        if (err) {
            return cb(err);
        }
        res.send(issues);
    });
});

router.get('/issues', function(req, res) {
    var params = {
        collection: 'issues',
        sort: {'issue_number': 1}
    };
    db.find(params, function(err, issues) {
        if (err) {
            return cb(err);
        }
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
            return cb(err);
        }
        res.send(issue);
    });
});

router.get('issues/:issueId/:pageNo', function(req, res) {
    var params = {
        collection: 'issues',
        query: {'id': req.params.issueId}
    };
    db.find(params, function(err, issue) {
        if (err) {
            return err;
        }
        archive.extractIssue(issue.issues.file_path, function (err, handler, entries, ext) {
            if (err) {
                return err;
            }
            archive.getPage(handler, entries, ext, req.params.pageNo, function (err, base64Img) {
                if (err) {
                    return err;
                }
                res.send(base64Img);
            });
        });
    });
});

module.exports = router;