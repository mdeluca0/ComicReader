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
};

module.exports.replaceEscapedCharacters = function(s) {
    s = s.replace("&#47;", '/');
    s = s.replace("&#92;", '\\');
    s = s.replace("&#58;", ':');
    s = s.replace("&#42;", '*');
    s = s.replace("&#63;", '?');
    s = s.replace("&#34;", '"');
    s = s.replace("&#60;", '<');
    s = s.replace("&lt;", '<');
    s = s.replace("&#62;", '>');
    s = s.replace("&gt;", '>');
    s = s.replace("&#124;", '|');

    return s;
};