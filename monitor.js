var chokidar = require('chokidar');

/*var watcher = chokidar.watch('file or dir', {ignored: /^\./, persistent: true});

watcher
    .on('add', function(path) {console.log('File', path, 'has been added');})
    .on('change', function(path) {console.log('File', path, 'has been changed');})
    .on('unlink', function(path) {console.log('File', path, 'has been removed');})
    .on('error', function(error) {console.error('Error happened', error);})*/


// watches for changes to the directory and looks for missing metadata or active files