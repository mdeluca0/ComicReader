const consts = require('../consts');
const directoryRepo = require('../repositories/directory-repository');

const pageSize = 50;

module.exports = function(app){
    app.get('/volumes', function(req, res) {
        let offset = parseInt(req.query.offset) || 0;
        let query = {parent: null};
        let sort = {name: 1};
        let filter = {id: 1, name: 1, start_year: 1, cover: 1};

        directoryRepo.findVolumesWithMeta(query, sort, filter, function(err, volumes) {
            if (err) {
                //TODO: send error response
                return err;
            }

            volumes = {
                volumes: volumes.slice(offset, offset + pageSize)
            };

            res.send(volumes);
        });
    });

    app.get('/volumes/:volumeId', function(req, res) {
        let query = {_id: consts.convertId(req.params.volumeId)};
        let filter = {id: 1, description: 1, name: 1, start_year: 1, cover: 1, 'publisher.name': 1};

        directoryRepo.findVolumesWithMeta(query, {}, filter, function(err, volume) {
            if (err) {
                //TODO: send error response
                return err;
            }
            res.send(volume);
        });
    });

    app.get('/volumes/:volumeId/issues', function(req, res) {
        let offset = parseInt(req.query.offset) || 0;
        let query = {parent: consts.convertId(req.params.volumeId)};
        let sort = {issue_number: 1};
        let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};

        directoryRepo.findIssuesWithMeta(query, sort, filter, function(err, issues) {
            if (err) {
                //TODO: send error
            }

            issues = {
                issues: issues.slice(offset, offset + pageSize)
            };

            res.send(issues);
        });
    });
};