const archive = require('../archive');
const directoryRepo = require('../repositories/directory-repository');
const issuesRepo = require('../repositories/issues-repository');

const pageSize = 50;

module.exports = function(app) {
    app.get('/issues', function (req, res) {
        let offset = parseInt(req.query.offset) || 0;
        let query = {parent: {$ne: null}};
        let sort = {'volume.name': 1, file: 1};
        let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};

        directoryRepo.findIssuesWithMeta(query, sort, filter, function (err, issues) {
            if (err) {
                //TODO: send error response
            }

            issues = {
                issues: issues.slice(offset, offset + pageSize)
            };

            res.send(issues);
        });
    });

    app.get('/issues/search', function(req, res) {
        if (!req.query.search) {
            res.send({});
        }

        let query = {$text: {$search: req.query.search}};
        let sort = {'volume.name': 1, file: 1};
        let filter = {name: 1, issue_number: 1, cover: 1, 'volume.id': 1, 'volume.name': 1};

        issuesRepo.search(query, sort, filter, function(err, issues) {
            if (err) {
                //TODO: send error
            }
            res.send(issues);
        });
    });

    app.get('/issues/:issueId', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)};

        directoryRepo.findIssuesWithMeta(query, {}, {}, function (err, issue) {
            if (err) {
                //TODO: send error response
            }

            if (!issue.length) {
                return {};
            }

            issue = issue.shift();
            issue.previous = {};
            issue.next = {};

            //pull issues by volume
            let query = {parent: issue.parent};
            let filter = {_id: 1, issue_number: 1};
            directoryRepo.findIssuesWithMeta(query, {}, filter, function(err, issues) {
                if (err) {
                    res.send(issue);
                    return;
                }

                issues.sort(require('../sorts').sortIssueNumber);

                let index = issues.findIndex(obj => obj.file === issue.file);

                if (index - 1 >= 0) {
                    issue.previous = {
                        _id: issues[index-1]._id.toString(),
                        issue_number: issues[index-1].issue_number
                    };
                }
                if (index + 1 < issues.length) {
                    issue.next = {
                        _id: issues[index+1]._id.toString(),
                        issue_number: issues[index+1].issue_number
                    };
                }

                res.send(issue);
            });
        });
    });

    app.get('/issues/:issueId/page_count', function (req, res) {
        let query = {_id: require('../db').convertId(req.params.issueId)}

        directoryRepo.findIssuesWithMeta(query, {}, {}, function (err, issue) {
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

        directoryRepo.findIssuesWithMeta(query, {}, {}, function (err, issue) {
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