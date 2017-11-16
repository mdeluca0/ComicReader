var unrar = require('unrar'); //UnRar.exe must be installed and listed in the PATH variable.
var admZip = require('adm-zip'); //Batch archive rebuild: FOR %i IN (*.*) DO E:\7-Zip\7z.exe a "%~ni.7z" "%i"
var fs = require('fs');
var db = require('./db');
var scanner = require('./scanner');

function getPage(issue, pageNo, cb) {
    scanner.getIssueFile(issue, function(file) {
        var ext = file.substr(file.lastIndexOf('.') + 1);
        if (ext === 'cbr') {
            getCbrPage(file, pageNo, function(base64Img) {
                return cb(base64Img);
            });
        } else if (ext === 'cbz') {
            getCbzPage(file, pageNo, function(base64Img) {
                return cb(base64Img);
            });
        }
    });
}

function getCbrPage (file, pageNo, cb) {
    var archive = new unrar(file);

    archive.list(function(err, entries) {
        // remove non-file elements from entries
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].type !== 'File') {
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

        // out of bounds checks
        if (pageNo < 0) {
            pageNo = 0;
        }
        if (pageNo >= entries.length) {
            pageNo = entries.length - 1;
        }

        var archiveFilePath = entries[pageNo].name;
        var fileName = archiveFilePath.replace(/^.*[\\\/]/, '');
        var stream = archive.stream(archiveFilePath);
        var tempPath = './temp/' + fileName;

        stream.pipe(fs.createWriteStream(tempPath));

        stream.on('end', function() {
            fs.readFile(tempPath, function(err, buf) {
                var base64Img = buf.toString('base64');
                fs.unlink(tempPath);
                return cb(base64Img);
            });
        });
    });
}

function getCbzPage (file, pageNo, cb) {
    var zip = new admZip(file);
    var entries = zip.getEntries();

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

    // out of bounds checks
    if (pageNo < 0) {
        pageNo = 0;
    }
    if (pageNo >= entries.length) {
        pageNo = entries.length - 1;
    }

    var entryName = entries[pageNo].entryName;
    var tempPath = './temp';
    var name = entries[pageNo].name.replace(/^.*[\\\/]/, '');

    zip.extractEntryTo(entryName, tempPath, false, true);

    fs.readFile(tempPath + '/' + name, function(err, buf) {
        var base64Img = buf.toString('base64');
        fs.unlink(tempPath + '/' + name);
        return cb(base64Img);
    });
}

function populatePageCounts(issues, cb) {
    var container = [];
    getPageCount(issues, container, function(issues) {
        return cb(issues);
    });
}

function getPageCount(issues, container, cb) {
    if (issues[container.length].active === 'N') {
        var issue = issues[container.length];
        issue.page_count = 0;
        container.push(issue);

        if (container.length == issues.length) {
            return cb(container);
        } else {
            getPageCount(issues, container, cb);
        }
    } else {
        db.getIssue(issues[container.length].id, function (issue) {
            scanner.getIssueFile(issue, function (file) {
                var ext = file.substr(file.lastIndexOf('.') + 1);
                if (ext === 'cbr') {
                    getCbrPageCount(file, function (pageCount) {
                        issues[container.length].page_count = pageCount;
                        container.push(issues[container.length]);

                        if (container.length == issues.length) {
                            return cb(container);
                        } else {
                            getPageCount(issues, container, cb);
                        }
                    });
                } else if (ext === 'cbz') {
                    getCbzPageCount(file, function (pageCount) {
                        issues[container.length].page_count = pageCount;
                        container.push(issues[container.length]);

                        if (container.length == issues.length) {
                            return cb(container);
                        } else {
                            getPageCount(issues, container, cb);
                        }
                    });
                }
            });
        });
    }
}

function getCbrPageCount (file, cb) {
    var archive = new unrar(file);
    archive.list(function (err, entries) {
        // only count file entries
        var count = 0;

        if (typeof(entries) !== 'undefined') {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].type === 'File') {
                    count++;
                }
            }
        }

        return cb(count);
    });
}

function getCbzPageCount (file, cb) {
    var count = 0;

    try {
        var zip = new admZip(file);
        var entries = zip.getEntries();

        for (var i = 0; i < entries.length; i++) {
            // only count file entries
            if (!entries[i].isDirectory) {
                count++;
            }
        }
    } catch (e) {
        console.log(file);
    }

    return cb(count);
}

module.exports.getPage = getPage;
module.exports.populatePageCounts = populatePageCounts;