const storyarcsRepo = require('../repositories/storyarcs-repository');

const pageSize = 50;

module.exports = function(app){
    app.get('/story_arcs', function(req, res) {
        let offset = parseInt(req.query.offset) || 0;
        let query = {};
        let sort = {name: 1};
        let filter = {name: 1, cover: 1};

        storyarcsRepo.find(query, sort, filter, function(err, storyArcs) {
            if (err) {
                //TODO: send error response
                return err;
            }

            storyArcs = {
                story_arcs: storyArcs.slice(offset, offset + pageSize)
            };

            res.send(storyArcs);
        });
    });

    app.get('/story_arcs/search', function(req, res) {
        if (!req.query.search) {
            res.send({});
        }

        let query = {$text: {$search: req.query.search}};
        let sort = {name: 1};
        let filter = {id: 1, name: 1, cover: 1};

        storyarcsRepo.search(query, sort, filter, function(err, storyArcs) {
            if (err) {
                //TODO: send error
            }
            res.send(storyArcs);
        });
    });

    app.get('/story_arcs/:storyArcId', function(req, res) {
        let query = {id: req.params.storyArcId};
        let filter = {id: 1, cover: 1, name: 1, deck: 1, 'publisher.name': 1};

        storyarcsRepo.find(query, {}, filter, function(err, storyArc) {
            if (err) {
                //TODO: send error response
                return err;
            }
            res.send(storyArc);
        });
    });

    app.get('/story_arcs/:storyArcId/issues', function(req, res) {
        let offset = parseInt(req.query.offset) || 0;
        let query = {id: req.params.storyArcId};
        let sort = {cover_date: 1};
        let filter = {
            'issue_number': 1,
            'name': 1,
            'cover': 1,
            'cover_date': 1,
            'volume.id': 1,
            'volume.name': 1
        };

        storyarcsRepo.findIssues(query, sort, filter, function(err, issues) {
            if (err) {
                //TODO: send error response
                return err;
            }

            issues = {
                issues: issues.slice(offset, offset + pageSize)
            };

            res.send(issues);
        });
    });
};