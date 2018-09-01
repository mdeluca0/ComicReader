var path = require('path');

module.exports = {
    entry: path.join(__dirname, 'src', 'bundles.js'),
    output: {
        path: path.join(__dirname, 'public'),
        filename: 'bundle.js'
    },
    mode: 'none'
}