var chokidar = require('chokidar');

/*var watcher = chokidar.watch('file or dir', {ignored: /^\./, persistent: true});

watcher
    .on('add', function(path) {console.log('File', path, 'has been added');})
    .on('change', function(path) {console.log('File', path, 'has been changed');})
    .on('unlink', function(path) {console.log('File', path, 'has been removed');})
    .on('error', function(error) {console.error('Error happened', error);})*/


// watches for changes to the directory and looks for missing metadata or active files

//when loading a new directory, queue a detailed request for every issue
//every second pop a request, check if it needs to be requested, and send if so.
// If the user navigates to an issue that doesn't have info, request it and remove that request from the queue.