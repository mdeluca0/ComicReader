const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');
const consts = require('./consts');

function createUser(user, cb) {
    getUser(username, function(err, res) {
        if (err) {
            return cb(err);
        }
        if (res.length) {
            return cb(null, false);
        }
        if (!res.length) {
            user.password = crypto.createHash('sha256').update(user.password).digest('base64');
            user.created = consts.getToday();
            upsertUser(user, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, true);
            });
        }
    });
}

function login(username, password, cb) {
    getUser(username, function(err, user) {
        if (err) {
            return cb(err);
        }
        var encryptedPwd = crypto.createHash('sha256').update(password).digest('base64');
        if (user.password === encryptedPwd) {
            user.token = jwt.sign({admin: username}, 'secret');
            user.expiration = (Date.now() / 1000) + 86400; // 24 hours from now
            upsertUser(user, function(err, res) {
                if (err) {
                    return cb(err);
                }
                return cb(null, user.token);
            });
        }
    });
}

function authenticate(username, token, cb) {
    getUser(username, function(err, user) {
        if (err) {
            return cb(err);
        }
        if (user.token === token && user.expiration >= Date.now() / 1000) {
            return cb(null, true);
        } else {
            return cb(null, false);
        }
    });
}

function getUser(username, cb) {
    var options = {
        collection: 'users',
        query: {'username': username}
    };
    db.find(options, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

function upsertUser(user, cb) {
    var params = {
        collection: 'users',
        identifier: {id: user.username},
        document: user
    };

    db.replace(params, function(err, res) {
        if (err) {
            return cb(err);
        }
        return cb(null, res);
    });
}

module.exports.createUser = createUser;
module.exports.login = login;
module.exports.authenticate = authenticate;