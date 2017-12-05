var express = require('express');
var router = express.Router();

var db = require('../db');
var archive = require('../archive');

// Initialize metadata refresher
require('../DataManager').startRefresh(false);

router.get('/getLibrary', function(req, res) {
    db.getActive(function(library) {
        res.send(library);
   });
});
router.get('/getVolume', function(req, res) {
    var volumeId = req.query.id;
    db.getVolume(volumeId, function(volume) {
        res.send(volume[0]);
    });
});
router.get('/getIssue', function(req, res) {
    var issueId = req.query.id;
    db.getIssue(issueId, function(issue) {
        res.send(issue);
    });
});
router.get('/readIssue', function(req, res) {
    var issueId = req.query.id;
    var pageNo = req.query.page;
    db.getIssue(issueId, function(issue) {
        archive.extractIssue(issue.file_path, function(err, handler, entries, ext) {
            archive.getPage(handler, entries, ext, pageNo, function (base64Img) {
                var result = {
                    'volumeName': issue.volumeName,
                    'volumeId': issue.volumeId,
                    'issueName': issue.name,
                    'issueId': issue.id,
                    'pageCount': issue.page_count,
                    'pageImage': base64Img
                };
                res.send(result);
            });
        });
    });
});

module.exports = router;