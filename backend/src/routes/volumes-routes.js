const directoryRepo = require('../repositories/directory-repository');
const volumesRepo = require('../repositories/volumes-repository');

module.exports = function(app){
    app.get('/volumes', function(req, res) {
        let query = {parent: null};
        let sort = {name: 1};
        let filter = {id: 1, name: 1, start_year: 1, cover: 1};
        let offset = parseInt(req.query.offset) || 0;

        directoryRepo.findVolumesWithMeta(query, sort, filter, offset, function(err, volumes) {
            if (err) {
                //TODO: send error response
                return err;
            }

            res.send({volumes: volumes});
        });
    });

    app.get('/volumes/search', function(req, res) {
        if (!req.query.search) {
            res.send({});
        }

        let query = {$text: {$search: req.query.search}};
        let sort = {name: 1};
        let filter = {id: 1, name: 1, start_year: 1, cover: 1};
        let offset = parseInt(req.query.offset) || null;

        volumesRepo.search(query, sort, filter, offset, function(err, volumes) {
            if (err) {
                //TODO: send error
            }

            volumes = volumes.filter(a => a.volumeFile != null);

            res.send({volumes: volumes});
        });
    });

    app.get('/volumes/:volumeId', function(req, res) {
        let query = {_id: require('../db').convertId(req.params.volumeId)};
        let filter = {id: 1, description: 1, name: 1, start_year: 1, cover: 1, 'publisher.name': 1};

        directoryRepo.findVolumesWithMeta(query, {}, filter, null, function(err, volume) {
            if (err) {
                //TODO: send error response
                return err;
            }

            res.send({volumes: volume});
        });
    });

    app.get('/volumes/:volumeId/issues', function(req, res) {
        let query = {parent: require('../db').convertId(req.params.volumeId)};
        let sort = {'metadata.index_in_volume': 1, file: 1};
        let filter = {id: 1, name: 1, issue_number: 1, cover: 1, 'volume.id': 1};
        let offset = parseInt(req.query.offset) || 0;

        directoryRepo.findIssuesWithMeta(query, sort, filter, offset, function(err, issues) {
            if (err) {
                //TODO: send error
            }

            res.send({issues: issues});
        });
    });
};