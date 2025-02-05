'use strict';

var Redis = require('ioredis');

var port = process.env.REDIS_PORT;
var host = process.env.REDIS_HOST;
var family = process.env.REDIS_FAMILY;
var password = process.env.REDIS_PASSWORD;
var db = process.env.REDIS_DB;

if (!port) {
    port = 6379;
}
if (!host) {
    host = '127.0.0.1';
}
if (!family) {
    family = 4;
}
if (!password) {
    password = '';
}
if (!db) {
    db = 0;
}

var RedisManager = function() {
    this.redis = new Redis({
        port: port,
        host: host,
        family: family,
        password: password,
        db: db
    });
    return this;
};

function processReturn(callback, dataClean) {
    return function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        callback(dataClean ? dataClean(result) : result);
    }
}

/*
 * Action Logger
 */
function logAction(message) {
    // TODO
}

/*
 * Song Data Sets
 */
var songName = 'song';

// History
// Song fkid => latest timestamp :: timed expire
function genLastSongTimeName(fkid) {
    return songName + ':' + fkid + ':lastPlayed';
}
RedisManager.prototype.setLastSongTime = function(fkid, timestamp) {
    // Expire after 5 weeks
    this.redis.set(genLastSongTimeName(fkid), timestamp, "EX", 126000);
};
RedisManager.prototype.getLastSongTime = function(fkid, callback) {
    this.redis.get(genLastSongTimeName(fkid), processReturn(callback));
};

// Last Song key => Song fkid
function genLastSongTime() {
    return songName + ':lastPlayed';
}
RedisManager.prototype.setLastSong = function(fkid) {
    this.redis.set(genLastSongTime(), fkid);
};
RedisManager.prototype.getLastSong = function(callback) {
    this.redis.get(genLastSongTime(), processReturn(callback));
};

/*
 * User Data Sets
 */
var userName = 'user';

// Love
// Dubtrack Account => Love score
function genUserLoveName(userId) {
    return userName + ':' + userId + ':love';
}
RedisManager.prototype.setLove = function(userId, love) {
    this.redis.set(genUserLoveName(userId), parseInt(love, 10));
};
RedisManager.prototype.getLove = function(userId, callback) {
    this.redis.get(genUserLoveName(userId), processReturn(callback, function(result) {
        if (result) {
            return parseInt(result, 10);
        }
    }));
};
RedisManager.prototype.incLove = function(userId) {
    this.redis.incr(genUserLoveName(userId));
};
RedisManager.prototype.decLove = function(userId) {
    this.redis.decr(genUserLoveName(userId));
};
RedisManager.prototype.incLoveBy = function(userId, love) {
    this.redis.incrby(genUserLoveName(userId), love);
};
RedisManager.prototype.decLoveBy = function(userId, love) {
    this.redis.decrby(genUserLoveName(userId), love);
};

// Props
// Dubtrack Account => Props score
function genUserPropsName(userId) {
    return userName + ':' + userId + ':props';
}
RedisManager.prototype.setProps = function(userId, props) {
    this.redis.set(genUserPropsName(userId), parseInt(props, 10));
};
RedisManager.prototype.getProps = function(userId, callback) {
    this.redis.get(genUserPropsName(userId), processReturn(callback, function(result) {
        if (result) {
            return parseInt(result, 10);
        }
    }));
};
RedisManager.prototype.incProps = function(userId) {
    this.redis.incr(genUserPropsName(userId));
};
RedisManager.prototype.decProps = function(userId) {
    this.redis.decr(genUserPropsName(userId));
};
RedisManager.prototype.incPropsBy = function(userId, props) {
    this.redis.incrby(genUserPropsName(userId), props);
};
RedisManager.prototype.decPropsBy = function(userId, props) {
    this.redis.decrby(genUserPropsName(userId), props);
};

// ------ Twitch - Dubtrack ------ START

// Twitch Dub Data Set
// Dubtrack Account => Twitch Account
function genUserTwitchIdName(userId) {
    return userName + ':' + userId + ':twitch:id';
}
RedisManager.prototype.setTwitch = function(userId, twitchUserId) {
    this.redis.set(genUserTwitchIdName(userId), twitchUserId);
};
RedisManager.prototype.getTwitch = function(userId, callback) {
    this.redis.get(genUserTwitchIdName(userId), processReturn(callback));
};

// Twitch Dub Key Sets
// Auth Key => Twitch account
function genTwitchAuthKeyName(key) {
    return userName + 'twitch:auth:key:' + key + ':id';
}
RedisManager.prototype.setTwitchAuthKey = function(key, twitchUserId) {
    this.redis.set(genTwitchAuthKeyName(key), twitchUserId);
};
RedisManager.prototype.getTwitchAuthKey = function(key, callback) {
    this.redis.get(genTwitchAuthKeyName(key), processReturn(callback));
};

// Twitch Sub Set
// Twitch Account => is Sub
function genTwitchSubName(twitchUserId) {
    return userName + ':twitch:id' + twitchUserId + ':sub';
}
RedisManager.prototype.setTwitchSub = function(twitchUserId, bool) {
    this.redis.set(genTwitchSubName(twitchUserId), bool);
};
RedisManager.prototype.getTwitchSub = function (twitchUserId, callback) {
    this.redis.get(genTwitchSubName(twitchUserId), processReturn(callback));
};

// Twitch Dub Key Sets
// Auth Key => Dubtrack account
function genTwitchDubAuthKeyName(key) {
    return userName + 'twitch:auth:key:' + key + ':dub';
}
RedisManager.prototype.setTwitchDubAuthKey = function(key, userId) {
    this.redis.set(genTwitchDubAuthKeyName(key), userId);
};
RedisManager.prototype.getTwitchDubAuthKey = function(key, callback) {
    this.redis.get(genTwitchDubAuthKeyName(key), processReturn(callback));
};

// ------ Twitch - Dubtrack ------ END

// User Command cooldown
// Dubtrack Account => is on cooldown :: timed expire
function genUserCommandCooldownName(userId) {
    return userName + ':' + userId + ':command:cooldown';
}
RedisManager.prototype.setUserCommandCooldown = function(userId, time) {
    var nTime = Math.floor(time);
    if (nTime > 0) {
        this.redis.set(genUserCommandCooldownName(userId), true, "EX", nTime);
    }
};
RedisManager.prototype.getUserCommandCooldown = function(userId, callback) {
    this.redis.get(genUserCommandCooldownName(userId), processReturn(callback, function(result) {
        return result ? true : false;
    }));
};

module.exports = new RedisManager();
