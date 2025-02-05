/*
 **************************************************************************
 * ABOUT
 **************************************************************************
 *
 * Nb3Bot is a bot created for the
 * NightBlue3 room on www.dubtrack.fm
 *
 **************************************************************************
 *
 **************************************************************************
 * DEVELOPERS
 **************************************************************************
 *
 * @ZubOhm
 * @Netux
 * @Matt
 *
 **************************************************************************
 */

var AgarioClient = require('agario-client');
var reddit = require('redwrap');
// Time formatting
var moment = require('moment');

// Other settings
var neonCat = true;

function regCommands(commandManager) {
    var Command = commandManager.Command;
    /**
     * @param {CommandManager} commandManager
     */
    [
        new Command('hello', ['hello'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var secretChance = Math.floor(Math.random() * 100) === 0;
                if (secretChance) {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' hello...');
                    setTimeout(function () {
                        utils.bot.sendChat('... it\'s me...');
                    }, 4500); // you left out a ; how dare you!
                }
                else {
                    utils.bot.sendChat('Hi There, @' + utils.getUserUsername());
                }
            }
        )
        ,
        new Command('agar', ['agar'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                AgarioClient.servers.createParty("US-Atlanta", function (data) {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' has created an agario party. Join them at www.agar.io/#' + data.key);
                });
            }
        )
        ,
        new Command('del', ['del'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getTargetName()) {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' ' + utils.getTargetName() + ' has been deleted. *Beep Boop*');
                }
            }
        )
        ,
        new Command('gaben', ['gaben'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                reddit.r('gentlemangabers', function (err, data, res) {
                    if (err != null) {
                        console.log(err);
                    }
                    var children = data.data.children;
                    var random = Math.floor((Math.random() * children.length - 1) + 1);
                    if (children[random].data.url.indexOf("imgur") > -1) {
                        utils.bot.sendChat(children[random].data.url);
                    }
                });
            }
        )
        ,
        new Command('song', ['song'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat('@' + utils.getUserUsername() + ' The current song is ' + utils.getMediaName() + ', the link is ' + utils.currentMediaPermaLink);
            }
        )
        ,
        new Command('stream', ['stream'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.twitchManager.getStream('Nightblue3', function (err, body) {
                    if (err) {
                        console.log(err);
                    }
                    var stream = body.stream;
                    if (stream) {
                        utils.bot.sendChat(stream.channel.display_name + ' is streaming ' + stream.channel.game + '! You can watch him at ' + stream.channel.url + '!');
                        utils.bot.sendChat(stream.preview.small + ' Viewers:' + stream.viewers);
                    }
                    else {
                        utils.bot.sendChat('NightBlue3 is not currently streaming! He streams at http://www.twitch.tv/nightblue3');
                    }
                });
            }
        )
        ,
        new Command('nyancat', ['nyancat'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(":nyancat: ~ Meow!");
                neonCat = false;
                setTimeout(function () {
                    neonCat = true;
                }, 60000);
            }
        )
        ,
        // No cooldown because no messages no need to cool this down
        new Command('props', ['props'], 0, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getUserId() === utils.currentDJ.id) {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' we know you love your song, but let others also prop you!');
                    return;
                }
                utils.propsManager.addProp(utils.getUserId());
            }
        )
        ,
        new Command('eta', ['eta'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' In order to get the ETA Timer, please download the DubX Extension from https://dubx.net/');
                utils.bot.sendChat('http://i.imgur.com/ldj2jqf.png');
            }
        )
        ,
        new Command('myprops', ['myprops'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.redisManager.getProps(utils.getUserId(), function (result) {
                    if (result) {
                        var propss = 'prop';
                        if (result > 1) {
                            propss += 's';
                        }
                        utils.bot.sendChat('@' + utils.getUserUsername() + ' you have ' + result + ' ' + propss + '! :)');
                    }
                    else {
                        utils.bot.sendChat('@' + utils.getUserUsername() + ' you don\'t have any props! Play a song to get props! :)');
                    }
                });
            }
        )
        ,
        new Command('mylove', ['mylove'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.redisManager.getLove(utils.getUserId(), function (result) {
                    if (result) {
                        utils.bot.sendChat('@' + utils.getUserUsername() + ' you have ' + result + ' hearts! :)');
                    }
                    else {
                        utils.bot.sendChat('@' + utils.getUserUsername() + ' you don\'t have any love! :(');
                    }
                });
            }
        )
        ,
        // RDJ+ because of how much spam it can cause
        new Command('subsunday', ['subsunday'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' On Sunday we lock the queue and let only NightBlue3 twitch subs play for the duration of the stream that day.');
                utils.bot.sendChat('You can sub to Nightblue3 https://www.twitch.tv/nightblue3/subscribe');
            }
        )
        ,
        new Command('residentdj', ['sub', 'subs', 'subscribe', 'residentdj', 'rdj'], 1, ['resident-dj'], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + " To get Resident DJ be a sub to Nightblue3's twitch.");
                utils.bot.sendChat('You can become a sub to NB3 here! https://twitch.tv/nightblue3/subscribe.');
                utils.bot.sendChat('Once you\'re a sub you can go to https://nightbluebot.larry1123.net/auth/twitch/ and I will give subs RDJ!');
                utils.bot.sendChat('Resident DJs can play in locked queues (notably Sub Sunday) and have shorter command cooldowns.');
            }
        )
        ,
        new Command('rules', ['rules'], 0.5, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' Rules: http://git.io/vWJnY');
            }
        )
        ,
        new Command('kappa', ['kappa'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' ' + utils.getUserUsername() + ' has sent a Kappa your way! :kappa:');
            }
        )
        ,
        new Command('dubx', ['dubx'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' you can download DubX at http://www.dubx.net');
                utils.bot.sendChat('Follow this guide to help you install DubX! https://git.io/vzCVn');
            }
        )
        ,
        new Command('css', ['css'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' Fancy css files: http://imgur.com/a/WeXhS');
                utils.bot.sendChat('Custom css chooser: https://goo.gl/Gs6gih');
            }
        )
        ,
        new Command('background', ['bg', 'background', 'backgrounds'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var args = utils.getMessage().split(' ').slice(1);
                var targetName = utils.getTargetName(args.length - 1);
                var bgLinks = {
                    'Snaky': 'https://imgur.com/a/ZO2Nz'
                    ,
                    'Maskinen': 'https://imgur.com/a/Up7b2'
                    ,
                    'Netux': 'https://imgur.com/a/j6QbM'
                    ,
                    'Frosolf': 'https://imgur.com/a/NZvz1 | https://imgur.com/a/Xi4Cx (anime)'
                    ,
                    'SiilerBloo': 'https://imgur.com/a/oZKQ3'
                };
                function checkIfSpecify() {
                    var r = null;
                    Object.keys(bgLinks).forEach(function (name) {
                        if (name.toLowerCase() === args[0].toLowerCase()) {
                            r = name;
                        }
                    });
                    return r;
                }
                var bgUrl;
                if (args.length > 0 && (bgUrl = checkIfSpecify())) {
                    utils.bot.sendChat(utils.getTargetName(2) + ' ' + bgUrl + "'s BGs: " + bgLinks[bgUrl]);
                }
                else {
                    Object.keys(bgLinks).forEach(function (name, i) {
                        utils.bot.sendChat((i === 0 ? targetName : '') + ' ' + name + "'s BGs: " + bgLinks[name]);
                    });
                }
            }
        )
        ,
        new Command('queue', ['queue'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' How to Queue a Song: https://imgur.com/a/FghLg');
            }
        )
        ,
        new Command('hate', ['hate'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var username = utils.getTargetName().replace("@", "");
                // Stop here if they are trying to do what they don't
                // Get that user object
                var thatUser = utils.bot.getUserByName(username);
                if (thatUser) {
                    // I love them all I watch over them and protect them
                    if (thatUser.id == utils.bot.getSelf().id) {
                        utils.bot.sendChat('You can\'t hate me, you can only love me, @' + utils.getUserUsername() + '!');
                        return 1;
                    }
                    // Ok everything should be good from here
                    utils.redisManager.decLove(utils.getUserId());
                    utils.redisManager.getLove(utils.getUserId(), function(love) {
                        utils.bot.sendChat("@" + thatUser.username + " " + utils.getUserUsername() + " has broken one of your hearts </3. You now have " + love + " hearts.");
                    });
                }
                else if (username != '') {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' I would tell them that you hate them but they seem to not be here.');
                }
            }
        )
        ,
        new Command('love', ['love'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var username = utils.getTargetName().replace("@", "");
                // Get that user object
                var thatUser = utils.bot.getUserByName(username);
                if (thatUser) {
                    // I love them all I watch over them and protect them
                    if (thatUser.id == utils.bot.getSelf().id) {
                        utils.bot.sendChat('I love you too, @' + utils.getUserUsername() + '!');
                    }
                    // Lets see if they should be told that they have a hand...
                    if (thatUser.id == utils.getUserId()) {
                        utils.bot.sendChat("@" + utils.getUserUsername() + " just use your hand....");
                        return 1;
                    }
                    // Ok everything should be good from here
                    var heartList = [ ':heart:', ':blue_heart:', ':purple_heart:', ':green_heart:', ':yellow_heart:' ];
                    utils.redisManager.incLove(utils.getUserId());
                    utils.redisManager.getLove(utils.getUserId(), function(love) {
                        utils.bot.sendChat("@" + thatUser.username + " " + utils.getUserUsername() + " gave you a heart " + heartList[Math.floor(Math.random() * heartList.length)] + ". You now have " + love + " hearts.");
                    });
                }
                else if (username != '') {
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' I would tell them that you love them but they seem to not be here.');
                }
            }
        )
        ,
        new Command('plops', ['plops'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' :poop:');
            }
        )
        ,
        new Command('ping', ['ping'], 0.5, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat('@' + utils.getUserUsername() + ' pong!');
            }
        )
        ,
        new Command('pong', ['pong'], 0.5, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat('@' + utils.getUserUsername() + ' ping!');
            }
        )
        ,
        new Command('selfpromotion', ['selfpromotion'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' Please refrain from any self promotion in this room. As told in the rules: http://i.imgur.com/2zE0SPf.png');
            }
        )
        ,
        new Command('english', ['english'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' Please stick to English in this room, doing otherwise will result in a mute.');
            }
        )
        ,
        new Command('shush', ['shush'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' (Click for better quality) http://i.imgur.com/uFE8PfA.png');
                utils.bot.sendChat('(snippet from Community Rules, http://git.io/vWJnY#miscellaneous)');
            }
        )
        ,
        new Command('gema', ['gema', 'fuckgema', 'gemasucks', 'gemaisshit'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' To bypass GEMA blocked videos you can use this extension http://www.unblocker.yt/en/');
            }
        )
        ,
        new Command('videocheck', ['videocheck'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + ' Check if current video is available on any country at https://nb3x.nl/videocheck.php');
            }
        )
        ,
        new Command('lovepercentage', ['lovepercent', 'love\%', 'lovepercentage'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getMessage().split(" ").length > 1) {
                    var username = utils.getMessage().split(" ")[1].replace("@", "");
                    if (username == utils.getUserUsername()) {
                        utils.bot.sendChat("@" + utils.getUserUsername() + " well I don't know.... how much do you love yourself?");
                        return;
                    }
                    else if (username === utils.bot.getSelf.username) {
                        utils.bot.sendChat('@' + utils.getUserUsername() + " of course I love you 100%, silly <3");
                        return;
                    }
                    var username2 = utils.getUserUsername();
                    if (utils.getMessage().split(' ').length > 2) {
                        username2 = utils.getMessage().split(' ')[2].replace('@', '');
                    }
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' there is ' + (Math.floor(Math.random() * 100)) + '% of :nb3h: between ' + username2 + ' and ' + username);
                }
            }
        )
        ,
        new Command('roominfo', ['roominfo', 'community', 'room', 'info'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.bot.sendChat(utils.getTargetName() + 'This community plays EDM | Trap | and Chill. Songs over 6:30 will be skipped so please follow the guidelines! Rules: http://git.io/vWJnY');
            }
        )
        ,
        // Mode command only no cooldown needed : require mute
        new Command('mute', ['mute'], 0, [], ['mute'],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var username = utils.getTargetName().replace("@", "");
                var muteuser = utils.bot.getUserByName(username, true);
                if (muteuser) {
                    var muteTime = parseFloat(utils.getMessage().split(" ")[2]);
                    if (isNaN(muteTime)) {
                        muteTime = 5;
                    }
                    utils.botUtils.timeMute(muteuser, muteTime, "@" + username + " muted for " + muteTime + " minutes!");
                }
                else {
                    utils.bot.sendChat("No user found by the name " + username + ".")
                }
            }
        )
        ,
        // Mode command only no cooldown needed : require mute
        new Command('timeout', ['timeout'], 0, [], ['mute'],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var username = utils.getTargetName().replace("@", "");
                var muteuser = utils.bot.getUserByName(username, true);
                if (muteuser) {
                    var muteTime = parseFloat(utils.getMessage().split(" ")[2]);
                    if (isNaN(muteTime)) {
                        muteTime = 5;
                    }
                    utils.botUtils.timeoutUser(muteuser, muteTime, "@" + muteuser.username + " timed out for " + muteTime + " minutes!");
                }
                else {
                    utils.bot.sendChat("No user found by the name " + username + ".")
                }
            }
        )
        ,
        new Command('seppuku', ['seppuku'], 0, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.botUtils.clearUserChat(utils.getUser());
                utils.bot.sendChat("Cleared all chat by " + utils.getUserUsername());
            }
        )
        ,
        new Command('lastplayed', ['lastplayed', 'history'], 1, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.redisManager.getLastSongTime(utils.getMediaId(), function (result) {
                    if (result) {
                        utils.bot.sendChat('This song was last played ' + timeDifference(Date.now(), parseInt(result)) + '.');
                    }
                    else {
                        utils.bot.sendChat('This song has not played in the last 5 weeks. Maybe this is a remix, or a reupload.');
                    }
                });
            }
        )
        ,
        new Command('twitchlink', ['twitchlink'], 0.5, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var key = utils.getMessage().split(" ")[1];
                utils.redisManager.getTwitchDubAuthKey(key, function (result) {
                    if (result) {
                        if (utils.getUserId = result) {
                            utils.redisManager.getTwitchSub(result, function (result) {
                                if (result) {
                                    if (utils.bot.hasPermission(utils.bot.getSelf(), 'set-roles')) {
                                        if (!utils.getUserRole()) {
                                            utils.bot.moderateSetRole(utils.getUserId(), 'resident-dj');
                                        }
                                    }
                                    else {
                                        utils.bot.sendChat('@' + utils.getUserUsername() + ' you have a role in this room as it is I will not change it.');
                                    }
                                }
                            });
                        }
                        else {
                            utils.bot.sendChat('This key has been used on another dubtrack account!');
                        }
                    }
                    else {
                        utils.redisManager.getTwitchAuthKey(key, function (result) {
                            if (result) {
                                utils.redisManager.setTwitch(utils.getUserId(), result);
                                utils.bot.sendChat('@' + utils.getUserUsername() + ' your account has been linked with the twitch account ' + result);
                                utils.redisManager.getTwitchSub(result, function (result) {
                                    if (result) {
                                        if (utils.bot.hasPermission(utils.bot.getSelf(), 'set-roles')) {
                                            if (!utils.getUserRole()) {
                                                utils.bot.moderateSetRole(utils.getUserId(), 'resident-dj');
                                            }
                                        }
                                    }
                                });
                                utils.redisManager.setTwitchDubAuthKey(key, utils.getUserId());
                            }
                            else {
                                /// Well this is not a key it seems just let it go
                            }
                        });
                    }
                });
            }
        )
        ,
        new Command('commands', ['commands'], 0, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                var message = '';
                commandManager.getCommandList().forEach(function(commandListElement) {
                    message += (message == '' ? '' : ', ') + commandListElement.commandId;
                });
                message = utils.getTargetName() + ' Hi the commands I have are: ' + message;
                utils.bot.sendChat(message);
            }
        )
        ,
        new Command('setcd', ['setcd'], 0, ['mod'], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getMessage().split(" ")[1] == undefined) {
                    return 1;
                }
                var input = isNaN(parseInt(utils.getMessage().split(" ")[1]));
                if (!input) {
                    utils.settingsManager.setCooldown(input);
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' set cooldown to ' + utils.getMessage().split(' ')[1] + ' seconds.');
                }
            }
        )
        ,
        new Command('setimgtime', ['setimgtime'], 0, ['mod'], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getMessage().split(" ")[1] == undefined) {
                    return 1;
                }
                var input = isNaN(parseInt(utils.getMessage().split(" ")[1])());
                if (!input) {
                    utils.settingsManager.setImgTime(input);
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' set image removal time to ' + input + ' seconds.');
                }
            }
        )
        ,
        new Command('imgdubsamount', ['imgdubsamount'], 0, ['mod'], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getMessage().split(" ")[1] == undefined) {
                    return 1;
                }
                var input = isNaN(parseInt(utils.getMessage().split(" ")[1])());
                if (!input) {
                    utils.settingsManager.setImgDubsAmount(input);
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' set the amount of dubs for images to ' + input);
                }
            }
        )
        ,
        new Command('imgRemoveMuteTime', ['imgRemoveMuteTime'], 0, ['mod'], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                if (utils.getMessage().split(" ")[1] == undefined) {
                    return 1;
                }
                var input = isNaN(parseInt(utils.getMessage().split(" ")[1])());
                if (!input) {
                    utils.settingsManager.setImgRemoveMuteTime(input);
                    utils.bot.sendChat('@' + utils.getUserUsername() + ' users will now get muted for ' + input + ' minutes for not meeting the required amount of dubs.');
                }
            }
        )
        ,
        new Command('skip', ['skip'], 0, [], [],
            /**
             * @param {MessageUtils} utils
             */
            function (utils) {
                utils.timeMuteUser(5, '!shush');
            }
        )
    ].forEach(function (command) {
            var ret = commandManager.addCommand(command);
            if (!ret) {
                console.error('Command failed to be added, Command:' + command.id);
            }
        }
    )
}

function timeDifference(newTime, oldTime) {
    return moment(oldTime).from(newTime);
}

module.exports = regCommands;
