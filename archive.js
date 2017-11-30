var unrar = require('unrar'); //UnRar.exe must be installed and listed in the PATH variable.
var admZip = require('adm-zip'); //Batch archive rebuild: FOR %i IN (*.*) DO E:\7-Zip\7z.exe a "%~ni.7z" "%i"
var thumb = require('node-thumbnail').thumb;
var fs = require('fs');
var toArray = require('stream-to-array');
var consts = require('./consts');

function extractIssue(file, cb) {
    //takes an issues from the db and attempts to extract the issue
    //on success it returns err = 0 and the extracted issue
    //on fail it return err = 1 and empty array
    var ext = file.substr(file.lastIndexOf('.') + 1);
    file = consts.ComicDirectory + '/' + file;
    if (ext === 'cbr') {
        extractCbr(file, function (err, handler, entries) {
            return cb(err, handler, entries, ext);
        });
    } else if (ext === 'cbz') {
        extractCbz(file, function (err, handler, entries) {
            return cb(err, handler, entries, ext);
        });
    }
}
function extractCbr(file, cb) {
    var archive = new unrar(file);
    archive.list(function(err, entries) {
        if (typeof(entries) !== 'undefined') {
            // remove non-file elements from entries
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].type !== 'File') {
                    entries.splice(i, 1);
                    i--;
                }
            }

            // sort rar images into correct order because sometimes they aren't
            entries.sort(function (a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });

            return cb(0, archive, entries);
        } else {
            return cb(1, null, []);
        }
    });
}
function extractCbz(file, cb) {
    try {
        var zip = new admZip(file);
        var entries = zip.getEntries();
    } catch (e) {
        return cb(1, null, []);
    }

    // remove non-file elements from entries
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].isDirectory) {
            entries.splice(i, 1);
            i--;
        }
    }

    // sort rar images into correct order because sometimes they aren't
    entries.sort(function(a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
    });

    return cb(0, zip, entries);
}
function getPage(handler, entries, ext, pageNo, cb) {
    //takes an issue from the db and a page no
    //calls extract issue
    //returns base 64 encoded page from archive
    if (ext === 'cbr') {
        getCbrPage(handler, entries, pageNo, function (page) {
            return cb(page);
        });
    } else if (ext === 'cbz') {
        getCbzPage(handler, entries, pageNo, function (page) {
            return cb(page);
        });
    }
}
function getCbrPage(handler, entries, pageNo, cb) {
    // out of bounds checks
    if (pageNo < 0) {
        pageNo = 0;
    }
    if (pageNo >= entries.length) {
        pageNo = entries.length - 1;
    }

    var archiveFilePath = entries[pageNo].name;
    var stream = handler.stream(archiveFilePath);

    toArray(stream, function (err, arr) {
        var buf = Buffer.concat(arr);
        var base64Img = buf.toString('base64');
        return cb(base64Img);
    });
}
function getCbzPage(handler, entries, pageNo, cb) {
    // out of bounds checks
    if (pageNo < 0) {
        pageNo = 0;
    }
    if (pageNo >= entries.length) {
        pageNo = entries.length - 1;
    }

    var entryName = entries[pageNo].entryName;

    var buf = handler.getEntry(entryName).getData();
    var base64Img = buf.toString('base64');

    return cb(base64Img);
}
function getPageCount(entries, cb) {
    //takes an extracted issue and returns the page count
    return cb(entries.length);
}
function getThumbnails(handler, entries, ext, cb) {
    //takes an extracted issue and returns an array of base 64 encoded thumbnails for each page
    if (ext === 'cbr') {
        getCbrThumbs(handler, entries, function(thumbs) {
            return cb(thumbs);
        });
    } else if (ext === 'cbz') {
        getCbzThumbs(handler, entries, function(thumbs) {
            return cb(thumbs);
        });
    }
}
function getCbrThumbs(handler, entries, cb) {
    getCbrThumb(handler, entries, [], function(thumbsArr) {
        thumbsArr.sort(function (a, b) {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
        var results = [];
        for (var i = 0; i < thumbsArr.length; i++) {
            results.push(thumbsArr[i].thumb);
        }
        return cb(results);
    });
}
function getCbrThumb(handler, entries, thumbs, cb) {
    var archiveFilePath = entries[thumbs.length].name;
    var fileName = archiveFilePath.replace(/^.*[\\\/]/, '');
    var stream = handler.stream(archiveFilePath);
    var path = consts.thumbnailDirectory;

    stream.pipe(fs.createWriteStream(path + '/' + fileName));

    stream.on('end', function() {
        thumb({
            source: path + '/' + fileName,
            destination: path,
            concurrency: 4,
            width: 150
        }).then(function(files) {
            fs.readFile(files[0].dstPath, function(err, buf) {
                var base64Img = buf.toString('base64');

                thumbs.push({
                    'name': files[0].srcPath,
                    'thumb': base64Img
                });

                fs.unlink(files[0].srcPath);
                fs.unlink(files[0].dstPath);

                if (thumbs.length === entries.length) {
                    return cb(thumbs);
                } else {
                    getCbrThumb(handler, entries, thumbs, cb);
                }
            });
        }).catch(function(e) {});
    });
}
function getCbzThumbs(handler, entries, cb) {
    var thumbs= [];
    getCbzThumb(handler, entries, thumbs, function(thumbsArr) {
        return cb(thumbsArr);
    });
}
function getCbzThumb(handler, entries, thumbs, cb) {
    var entryName = entries[thumbs.length].entryName;
    var name = entries[pageNo].name.replace(/^.*[\\\/]/, '');
    var path = consts.thumbnailDirectory;

    handler.extractEntryTo(entryName, path, false, true);

    thumb({
        source: sourcePath,
        destination: destPath,
        concurrency: 4,
        width: 150
    }, function(files, err, stdout, stderr) {
        fs.readFile(files[0].dstPath, function(err, buf) {
            var base64Img = buf.toString('base64');

            thumbs.push({
                'name': files[0].srcPath,
                'thumb': base64Img
            });

            fs.unlink(files[0].srcPath);
            fs.unlink(files[0].dstPath);

            if (thumbs.length === entries.length) {
                return cb(thumbs);
            } else {
                getCbzThumb(handler, entries, thumbs, cb);
            }
        });
    });
}

module.exports.extractIssue = extractIssue;
module.exports.getPage = getPage;
module.exports.getPageCount = getPageCount;
module.exports.getThumbnails = getThumbnails;