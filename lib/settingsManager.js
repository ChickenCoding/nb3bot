'use strict';

// Settings stuff only

var globalCooldown = (process.env.COOLDOWN == undefined ? 30 : process.env.COOLDOWN); // Cooldown in seconds
var imgTime = (process.env.IMGTIME == undefined ? 15 : process.env.IMGTIME); // time in seconds
var imgRemovalDubs_Amount = (process.env.IMAGEREMOVALDUBS_AMOUNT == undefined ? 10 : process.env.IMAGEREMOVALDUBS_AMOUNT); // amount of dubs
var imgRemovalDubs_Time = (process.env.IMAGEREMOVALDUBS_TIME == undefined ? 5 : process.env.IMAGEREMOVALDUBS_TIME); // time in mins

exports.getCooldown = function() {
    return globalCooldown;
};

exports.setCooldown = function(cooldown) {
    globalCooldown = cooldown;
};

/**
 * Returns the amount in seconds that the command should be cause in cooldown
 *
 * @param {MessageUtils} utils
 * @param {Number} commandCooldown
 */
exports.calulateCooldown = function(utils, commandCooldown) {
    if (commandCooldown <= 0) {
        return 0;
    }
    var coolD = commandCooldown;
    if (commandCooldown <= 1) {
        // if the cooldown is less than one take part of the global cooldown
        coolD = Math.floor(globalCooldown * commandCooldown);
    }
    if (!utils.getUserRole()) {
        // pleb for lack of a better term, full cooldown
        return coolD;
    }
    else if (utils.bot.isResidentDJ(utils.getUser())) {
        // rdj, 50% off cooldown
        return Math.floor(coolD * 0.5);
    }
    else if (utils.bot.isVIP(utils.getUser())) {
        // vip, 75% off cooldown
        return Math.floor(coolD * 0.25);
    }
    else {
        // mod staff, no cooldown
        return 0;
    }
};

exports.getImgTime = function() {
    return imgTime;
};

exports.setImgTime = function(imgTimeT) {
    imgTime = imgTimeT;
};

exports.getImgDubsAmount = function() {
    return imgRemovalDubs_Amount;
};

exports.setImgDubsAmount = function(imgDubsAmount) {
    imgRemovalDubs_Amount = imgDubsAmount;
};

exports.getImgRemoveMuteTime = function() {
    return imgRemovalDubs_Time;
};

exports.setImgRemoveMuteTime = function(imgRemoveMuteTime) {
    imgRemovalDubs_Time = imgRemoveMuteTime;
};

