const archive = require('../archive');
const directoryRepo = require('../repositories/directory-repository');
const issuesRepo = require('../repositories/issues-repository');

module.exports = function(app) {
    app.get('/issues', function (req, res) {
        let query = {parent: {$ne: null}};
        let sort = {'volume.name': 1, sort_number: 1, sort_letter: 1};
        let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};
        let offset = parseInt(req.query.offset) || 0;

        directoryRepo.findIssuesWithMeta(query, sort, filter, offset, function (err, issues) {
            if (err) {
                res.status(500);
                res.send('ERROR: Server Error');
                return;
            }

            res.status(200);
            res.send({issues: issues});
        });
    });

    app.get('/issues/search', function(req, res) {
        let query = {$text: {$search: req.query.search}};
        let sort = {'issueFile.file': 1};
        let filter = {name: 1, issue_number: 1, cover: 1, 'volume.id': 1, 'volume.name': 1};
        let offset = parseInt(req.query.offset) || null;

        issuesRepo.search(query, sort, filter, offset, function(err, issues) {
            if (err) {
                res.status(500);
                res.send('ERROR: Server Error');
                return;
            }

            if (!issues.length) {
                res.status(200);
                res.send({issues: []});
                return;
            }

            issues = issues.filter(a => a.issueFile != null);

            res.status(200);
            res.send({issues: issues});
        });
    });

    app.get('/issues/:issueId', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)};
        let filter = {
            _id: 1,
            name: 1,
            cover_date: 1,
            description: 1,
            issue_number: 1,
            cover: 1,
            'volume.name': 1,
            person_credits: 1,
            'story_arc_credits.story_arc.id': 1,
            'story_arc_credits.story_arc.name': 1
        };

        directoryRepo.findIssuesWithMeta(query, {}, filter, null, function (err, issue) {
            if (err) {
                res.status(500);
                res.send('ERROR: Server Error');
                return;
            }
            if (!issue.length) {
                res.status(200);
                res.send({issues: []});
                return;
            }

            issue[0].previous = {};
            issue[0].next = {};

            let query = {parent: issue[0].volume._id};
            let sort = {sort_number: 1, sort_letter: 1};
            let filter = {_id: 1, issue_number: 1};

            directoryRepo.find(query, sort, filter, null, function (err, issues) {
                if (err) {
                    res.status(500);
                    res.send('ERROR: Server Error');
                    return;
                }
                if (!issues.length) {
                    res.status(200);
                    res.send({issues: issue});
                    return;
                }

                let index = issues.findIndex(a => a._id.toString() === issue[0]._id.toString());

                if (issues[index - 1]) {
                    issue[0].previous = {_id: issues[index - 1]._id};
                }
                if (issues[index + 1]) {
                    issue[0].next = {_id: issues[index + 1]._id};
                }

                res.status(200);
                res.send({issues: issue});
            });
        });
    });

    app.get('/issues/:issueId/pageCount', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)}

        directoryRepo.findIssuesWithMeta(query, {}, {}, null, function (err, issue) {
            if (err) {
                res.status(500);
                res.send('ERROR: Server Error');
                return;
            }
            if (!issue.length) {
                res.status(404);
                res.send('ERROR: Issue Not Found');
                return;
            }

            issue = issue.shift();

            let path = issue.file;

            if (issue.volume.file) {
                path = issue.volume.file + '/' + path;
            }

            archive.extractIssue(path, function (err, handler, entries) {
                if (err) {
                    res.status(500);
                    res.send('ERROR: Server Error');
                    return;
                }
                archive.getPageCount(entries, function (err, count) {
                    if (err) {
                        res.status(500);
                        res.send('ERROR: Server Error');
                        return;
                    }

                    res.status(200);
                    res.send({pageCount: count});
                });
            });
        });
    });

    app.get('/issues/:issueId/:pageNo', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)};
        let pageNo = req.params.pageNo;

        if (isNaN(parseInt(pageNo))) {
            res.status(400);
            res.send('ERROR: Page Number Is Not A Number');
            return;
        }

        directoryRepo.findIssuesWithMeta(query, {}, {}, null, function (err, issue) {
            if (err) {
                res.status(500);
                res.send('ERROR: Server Error');
                return;
            }
            if (!issue.length) {
                res.status(404);
                res.send('ERROR: Issue Not Found');
                return;
            }

            issue = issue.shift();

            let path = issue.file;

            if (issue.volume.file) {
                path = issue.volume.file + '/' + path;
            }

            archive.extractIssue(path, function (err, handler, entries, ext) {
                if (err) {
                    res.status(500);
                    res.send('ERROR: Server Error');
                    return;
                }
                archive.getPage(handler, entries, ext, pageNo, function (err, base64Img) {
                    if (err) {
                        res.status(500);
                        res.send('ERROR: Server Error');
                        return;
                    }

                    res.status(200);
                    res.send({pageNo: pageNo, image: base64Img});
                });
            });
        });
    });
};