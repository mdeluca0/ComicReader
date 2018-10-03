const path = require('path');
const fs = require('fs');

module.exports.comicDirectory = 'C:/Comics';
module.exports.dbUrl = 'mongodb://localhost:27017/main';
module.exports.thumbDirectory = path.join(__dirname, '..', '..', 'frontend', 'assets', 'thumbs').replace(/\\/g, '/');
module.exports.apiUrl = 'https://www.comicvine.gamespot.com/api/';
module.exports.apiKey = '391531cd4d7943ad91be002c53f74dca5f461d9b';
module.exports.userAgent = 'Mozilla/5.0';

module.exports.convertToThreeDigits = function(number) {
    if (number.indexOf('.') !== -1) {
        var split = number.split('.');
        split[0] = ('000' + split[0]).substr(-3);
        return split[0] + '.' + split[1];
    } else {
        return ('000' + number).substr(-3);
    }
};

module.exports.replaceEscapedCharacters = function(s) {
    s = s.replace("&47;", '/');
    s = s.replace("&92;", '\\');
    s = s.replace("&58;", ':');
    s = s.replace("&42;", '*');
    s = s.replace("&63;", '?');
    s = s.replace("&34;", '"');
    s = s.replace("&60;", '<');
    s = s.replace("&lt;", '<');
    s = s.replace("&62;", '>');
    s = s.replace("&gt;", '>');
    s = s.replace("&124;", '|');

    return s;
};

module.exports.getToday = function() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return yyyy + '-' + mm + '-' + dd;
};

module.exports.mkDirRecursive = function(path) {
    let parts = path.split('/');
    let curPath = '';
    let length = parts.length;

    for (let i = 0; i < length; i++) {
        if (curPath !== '') {
            curPath += '/';
        }

        let part = parts.shift();

        curPath += part;

        if (part.indexOf(':') !== -1) {
            continue;
        }

        if (!fs.existsSync(curPath)) {
            fs.mkdirSync(curPath);
        }
    }
};