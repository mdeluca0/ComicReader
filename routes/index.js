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
        archive.getPage(issue, pageNo, function(base64Img) {
            issue.base64Img = base64Img;
            res.send(issue);
        });
    });
});

module.exports = router;