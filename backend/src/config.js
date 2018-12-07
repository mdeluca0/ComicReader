module.exports.comicDirectory = 'C:/Comics';
module.exports.dbUrl = 'mongodb://localhost:27017/main';
module.exports.thumbDirectory = require('path').join(__dirname, '..', '..', 'frontend', 'assets', 'thumbs').replace(/\\/g, '/');
module.exports.apiUrl = 'https://www.comicvine.gamespot.com/api/';
module.exports.apiKey = '391531cd4d7943ad91be002c53f74dca5f461d9b';
module.exports.userAgent = 'Mozilla/5.0';
module.exports.responseLimit = 50;