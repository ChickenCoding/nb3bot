'use strict';

var fs = require('fs');
var jsonfile = require('jsonfile');

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
        if (new RegExp('!' + utils.getUserUsername().toLowerCase()).test(utils.getMessage().toLowerCase())) {
            utils.bot.sendChat('@' + utils.getUserUsername() + ' is awesome!');
            return;
        }
        // !processCommands
        commandManager.processCommand(utils);
        if (utils.reply.stopping()) {
            return;
        }
    }
    if (new RegExp(utils.bot.getSelf().username, 'g').test(utils.getMessage())) {
        botActions(utils);
    }
    // Actions
};

// This is temp will be replaced with a manager if I find the time
function botActions(utils) {
    if (utils.getMessage().toLowerCase().indexOf("are you real") != -1) {
        utils.bot.sendChat("@" + utils.getUserUsername() + " yes I am real.");
        return;
    }
    // yes
    if (utils.getMessage().toLowerCase().indexOf("are you human") != -1) {
        utils.bot.sendChat("@" + utils.getUserUsername() + " no, I'm a robot with AI functionality.");
        return;
    }
    // yes
    if (utils.getMessage().toLowerCase().indexOf("are you a fan of nightblue3") != -1) {
        utils.bot.sendChat("@" + utils.getUserUsername() + " I love NB3 <3!");
        return;
    }
    // yes
    if (utils.getMessage().toLowerCase().indexOf("how old are you") != -1) {
        utils.bot.sendChat("Well, @" + utils.getUserUsername() + ", I've currently been running for " + utils.getRuntimeMessage().replace(" ago", "") + ".");
        return;
    }
    // yes
    if (utils.getMessage().toLowerCase().indexOf("gender") != -1) {
        utils.bot.sendChat("@" + utils.getUserUsername() + " I am female!");
        return;
    }
    if (utils.getMessage().toLowerCase().indexOf("o/") != -1) {
        utils.bot.sendChat("@" + utils.getUserUsername() + " o/");
        return;
    }
    if (/(rock|paper|scissors)/gi.test(utils.getMessage().toLowerCase())) {
        var rps = ['rock', 'paper', 'scissors'];
        var pick = Math.floor(Math.random() * rps.length);
        utils.bot.sendChat('@' + utils.getUserUsername() + ' ' + ['rock', 'paper', 'scissors'][pick]);
    }
}

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
        if (utils.settingsManager.getImgDubsAmount() >= 0 && utils.getUser().dubs < utils.settingsManager.getImgDubsAmount()) {
            utils.bot.moderateDeleteChat(utils.getId());
            utils.timeMuteUser(
                utils.settingsManager.getImgRemoveMuteTime(),
                'User muted for ' + utils.settingsManager.getImgRemoveMuteTime() + ' minutes. Reason: Sending Images having less than ' + utils.settingsManager.getImgDubsAmount() + ' dubs.'
            );
            utils.reply.stop();
        }
        else {
            setTimeout(function () {
                utils.bot.moderateDeleteChat(utils.getId());
            }, utils.settingsManager.getImgTime() * 1000);
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
