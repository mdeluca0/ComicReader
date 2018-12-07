const archive = require('../archive');
const directoryRepo = require('../repositories/directory-repository');
const issuesRepo = require('../repositories/issues-repository');

module.exports = function(app) {
    app.get('/issues', function (req, res) {
        let query = {parent: {$ne: null}};
        let sort = {'volume.name': 1, file: 1};
        let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};
        let offset = parseInt(req.query.offset) || 0;

        directoryRepo.findIssuesWithMeta(query, sort, filter, offset, function (err, issues) {
            if (err) {
                //TODO: send error response
            }

            res.send({issues: issues});
        });
    });

    app.get('/issues/search', function(req, res) {
        if (!req.query.search) {
            res.send({});
        }

        let query = {$text: {$search: req.query.search}};
        let sort = {'issueFile.file': 1};
        let filter = {name: 1, issue_number: 1, cover: 1, 'volume.id': 1, 'volume.name': 1};
        let offset = parseInt(req.query.offset) || null;

        issuesRepo.search(query, sort, filter, offset, function(err, issues) {
            if (err) {
                //TODO: send error
            }

            issues = issues.filter(a => a.issueFile != null);

            res.send({issues: issues});
        });
    });

    app.get('/issues/:issueId', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)};

        directoryRepo.findIssuesWithMeta(query, {}, {}, null, function (err, issue) {
            if (err) {
                //TODO: send error response
            }

            if (!issue.length) {
                return {};
            }

            issue = issue.shift();
            issue.previous = {};
            issue.next = {};

            let query = {
                $or: [
                    {$and: [
                        {parent: issue.parent}, {index_in_volume: issue.index_in_volume - 1},
                        {parent: issue.parent}, {index_in_volume: issue.index_in_volume + 1}
                    ]}
                ]
            };
            let filter = {_id: 1, issue_number: 1};
            directoryRepo.findIssuesWithMeta(query, {}, filter, null, function(err, issues) {
                if (err) {
                    res.send(issue);
                    return;
                }

                for (let i = 0; i < issues.length; i++) {
                    if (issues[i].index_in_volume === issue.index_in_volume - 1) {
                        issue.previous = {
                            _id: issues[i]._id.toString(),
                            issue_number: issues[i].issue_number
                        };
                    }
                    if (issues[i].index_in_volume === issue.index_in_volume + 1) {
                        issue.next = {
                            _id: issues[i]._id.toString(),
                            issue_number: issues[i].issue_number
                        };
                    }
                }

                res.send({issues: [issue]});
            });
        });
    });

    app.get('/issues/:issueId/page_count', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)}

        directoryRepo.findIssuesWithMeta(query, {}, {}, null, function (err, issue) {
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

    app.get('/issues/:issueId/:pageNo', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)};
        let pageNo = req.params.pageNo;

        if (isNaN(parseInt(pageNo))) {
            //todo: send error response
            return;
        }

        directoryRepo.findIssuesWithMeta(query, {}, {}, null, function (err, issue) {
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
};