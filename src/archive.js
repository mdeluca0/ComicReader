var unrar = require('unrar'); //UnRAR must be listed in your PATH variable.
var admZip = require('adm-zip'); //Batch archive rebuild: FOR %i IN (*.*) DO E:\7-Zip\7z.exe a "%~ni.7z" "%i"
var toArray = require('stream-to-array');
var consts = require('./consts');

//takes an issues from the db and attempts to extract the issue
function extractIssue(file, cb) {
    var ext = file.substr(file.lastIndexOf('.') + 1);
    file = consts.comicDirectory + '/' + file;

    if (ext === 'cbr') {
        extractCbr(file, function (err, handler, entries) {
            if (err) {
                return cb(err);
            }
            return cb(null, handler, entries, ext);
        });
    } else if (ext === 'cbz') {
        extractCbz(file, function (err, handler, entries) {
            if (err) {
                return cb(err);
            }
            return cb(null, handler, entries, ext);
        });
    } else {
        return cb(1);
    }
}

function extractCbr(file, cb) {
    var archive = new unrar(file);
    archive.list(function(err, entries) {
        if (err) {
            return cb(err);
        }
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
                if (a.name < b.name) { return -1; }
                if (a.name > b.name) { return 1; }
                return 0;
            });

            return cb(null, archive, entries);
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

    return cb(null, zip, entries);
}

function getPage(handler, entries, ext, pageNo, cb) {
    //takes an issue from the db and a page no
    //calls extract issue
    //returns base 64 encoded page from archive
    if (ext === 'cbr') {
        getCbrPage(handler, entries, pageNo, function (err, page) {
            if (err) {
                return cb(err);
            }
            return cb(null, page);
        });
    } else if (ext === 'cbz') {
        getCbzPage(handler, entries, pageNo, function (err, page) {
            if (err) {
                return cb(err);
            }
            return cb(null, page);
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
        if (err) {
            return cb(err);
        }
        var buf = Buffer.concat(arr);
        var base64Img = buf.toString('base64');
        return cb(null, base64Img);
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

    return cb(null, base64Img);
}

function getPageCount(entries, cb) {
    //takes an extracted issue and returns the page count
    if (entries.length) {
        return cb(null, entries.length);
    } else {
        return cb(1);
    }
}

module.exports.extractIssue = extractIssue;
module.exports.getPage = getPage;
module.exports.getPageCount = getPageCount;