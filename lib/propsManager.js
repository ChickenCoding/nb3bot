'use strict';

/**
 * @param {RedisManager} redisManager
 * @constructor
 */
var PropsManager = function(redisManager) {
    this.propsSet = [];
    this.redisManager = redisManager;
};

PropsManager.prototype.addProp = function(userId) {
    if (!this.propsSet.contains(userId)) {
        this.propsSet.push(userId);
    }
};

PropsManager.prototype.onSongChange = function(djId) {
    var that = this;
    var props = this.propsSet.length;
    that.redisManager.incPropsBy(djId, props);
    this.resetProps();
    return props;
};

PropsManager.prototype.resetProps = function() {
    this.propsSet = [];
};

PropsManager.prototype.getProps = function(userId, callback) {
    this.redisManager.getProps(userId, callback);
};

module.exports = PropsManager;