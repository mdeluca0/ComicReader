const consts = require('../consts');
const archive = require('../archive');
const directoryRepo = require('../repositories/directory-repository');

const pageSize = 50;

module.exports = function(app) {
    app.get('/issues', function (req, res) {
        let offset = 0;
        if (req.query.offset) {
            offset = parseInt(req.query.offset);
        }

        let query = {parent: {$ne: null}};
        let sort = {'volume.name': 1, issue_number: 1};
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

    app.get('/issues/:issueId', function (req, res) {
        let query = {_id: consts.convertId(req.params.issueId)};

        directoryRepo.findIssuesWithMeta(query, {}, {}, function (err, issue) {
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
            let query = {
                $or: [
                    {parent: issue[0].parent, issue_number: nextIssueNum},
                    {parent: issue[0].parent, issue_number: prevIssueNum}
                ]
            };
            let filter = {name: 1, issue_number: 1, cover: 1};

            directoryRepo.findIssuesWithMeta(query, {}, filter, function (err, issues) {
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

    app.get('/issues/:issueId/page_count', function (req, res) {
        let query = {_id: consts.convertId(req.params.issueId)}

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
        let query = {_id: consts.convertId(req.params.issueId)};
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