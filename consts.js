var path = require('path');

module.exports.ComicDirectory = 'E:/ReaderComics';
module.exports.thumbDirectory = path.join(__dirname, 'public', 'images', 'thumbs').replace(/\\/g, '/');
module.exports.thumbnailDirectory = path.join(__dirname, 'temp', 'thumbs').replace(/\\/g, '/'); //deprecated
module.exports.apiKey = '391531cd4d7943ad91be002c53f74dca5f461d9b';
module.exports.dbUrl = 'mongodb://localhost:27017/main';
module.exports.refreshInterval = 5; //minutes

module.exports.convertToThreeDigits = function(number) {
    if (number.indexOf('.') != -1) {
        var split = number.split('.');
        split[0] = ('000' + split[0]).substr(-3);
        return split[0] + '.' + split[1];
    } else {
        return ('000' + number).substr(-3);
    }
}