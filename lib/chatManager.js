'use strict';

var fs = require('fs');
var jsonfile = require('jsonfile');

// env vars
var imgTime = (process.env.IMGTIME == undefined ? 15 : process.env.IMGTIME); // Cooldown in seconds
var imgRemovalDubs_Amount = (process.env.IMAGEREMOVALDUBS_AMOUNT == undefined ? 10 : process.env.IMAGEREMOVALDUBS_AMOUNT);
var imgRemovalDubs_Time = (process.env.IMAGEREMOVALDUBS_TIME == undefined ? 5 : process.env.IMAGEREMOVALDUBS_TIME);

class ChatManager {}

/**
 * @param {MessageUtils} utils
 * @param {CommandManager} commandManager
 */
ChatManager.prototype.processChat = function (utils, commandManager) {
    // clean that chat!
    cleanChat(utils);
    if (utils.reply.stopping()) {
        // if we are done because of the cleaning stop!
        return;
    }
    // Commands
    // Things that start with ! are commands!
    if (/^!/.test(utils.getMessage())) {
        // !processCommands
        commandManager.processCommand(utils);
        if (utils.reply.stopping()) {
            return;
        }
    }
    // yea just actions then filling the list...
    // Actions
};

function cleanChat(utils) {
    var cleanFunctions = [
        cleanChatBanPhrases
        ,
        cleanChatImageTimeout
        ,
        cleanChatAdvertisingBan
    ];
    cleanFunctions.forEach(function (chatCleaner) {
        if (utils.reply.continuing()) {
            try {
                chatCleaner(utils);
            }
            catch (err) {
                console.error(err);
            }
        }
    });
}

function cleanChatBanPhrases(utils) {
    var banData = "banphrases.json";
    fs.stat(banData, function (err, stat) {
        var banJSON = jsonfile.readFileSync(banData);
        var phrases = banJSON.banPhrases;
        for (var key in phrases) {
            if (typeof phrases[key] != 'function' && utils.getUserRole() == null) {
                if (utils.getMessage().toLowerCase().indexOf(phrases[key].phrase.toLowerCase()) != -1) {
                    utils.bot.moderateDeleteChat(utils.getId());
                    if (phrases[key].banTime.toLowerCase() == "p") {
                        utils.bot.moderateBanUser(utils.getUserId());
                    }
                    else {
                        utils.bot.moderateBanUser(utils.getUserId(), phrases[key].banTime);
                    }
                    utils.bot.sendChat("User banned. Reason: " + phrases[key].reason);
                    utils.reply.stop();
                }
            }
        }
    });
}

function cleanChatImageTimeout(utils) {
    var re = /http(|s):\/\/.+\.(gif|png|jpg|jpeg)/i;
    if (re.test(utils.getMessage().toLowerCase()) && utils.getUserId() !== utils.bot.getSelf().id) {
        if (imgRemovalDubs_Amount >= 0 && utils.getUser().dubs < imgRemovalDubs_Amount) {
            utils.bot.moderateDeleteChat(utils.getId());
            utils.timeMuteUser(
                imgRemovalDubs_Time,
                'User muted for ' + imgRemovalDubs_Time + ' minutes. Reason: Sending Images having less than ' + imgRemovalDubs_Amount + ' dubs.'
            );
            utils.reply.stop();
        }
        else {
            setTimeout(function () {
                utils.bot.moderateDeleteChat(utils.getId());
            }, imgTime * 1000);
        }
    }
}

function cleanChatAdvertisingBan(utils) {
    var advertiseMatch = utils.getMessage().match(/dubtrack.fm\/join\/(.[^ ]+)/i);
    if (advertiseMatch) {
        if (advertiseMatch[1].toLowerCase() !== 'nightblue3') {
            utils.bot.moderateDeleteChat(utils.getId());
            utils.bot.moderateBanUser(utils.getUserId());
            utils.bot.sendChat("User banned. Reason: Advertising another DubTrack room.");
            utils.reply.stop();
        }
    }
}

module.exports = ChatManager;
