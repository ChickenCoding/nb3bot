/*
 **************************************************************************
 ABOUT
 **************************************************************************

 NightBlueBot is a bot created for the
 NightBlue3 room on www.dubtrack.fm


 **************************************************************************


 **************************************************************************
 DEVELOPERS
 **************************************************************************

 @ZubOhm
 @Netux
 @Matt
 @DemoZ
 @Larry1123

 **************************************************************************

 **************************************************************************
 COMMAND LIST
 **************************************************************************
 !hello - Bot Responds saying hello back.
 !request [request] - request a feature to the BOT
 !del [file] - Bot responds saying *file* deleted
 !gaben - pulls a random gaben picture from /r/gentlemangabers
 !quote [user] - pulls a quote from the quotes folder for *user*
 !meme [text] - generates a meme from memecaptain
 !song - pulls song data from dubtrack
 !stream - pulls nb3 stream data from twitch
 !lastplayed - Shows when the song was last played -- Slightly bugged atm
 !props - gives props to the current DJ
 !love [user] - gives someone love <3
 !lovepercent [user] - calculates love percentage between you and user
 !eta - Tells user to download dubx
 !dubx - Direct link to DubX homepage
 !myprops - let's the user view their props
 !mylove - let's the user view their hearts
 !rules - OBEY OR BE DESTROYED
 !kappa [user] - sends a kappa to somebody
 !hate [user] - Breaks someone's heart </3
 !plops - Echoe's a poop.
 ![user] - says the user is an awesome person.
 !agar - host an Agar.io party.
 !pong - ping!
 !ping - pong!
 !english - show community language rules
 !sush - show community skip rules
 !selfpromotion - show self promotion rules
 !videocheck - direct link to video availability
 !gema - direct link to Anti-Gema extension
 !css - shows imgur css album
 !bg - shows bg albums
 !queue - says how to queue a song
 !mute - mute the user for x amount of time
 !timeout - remove all messages from user and mute them for x amount of time
 !seppuku - remove all messages from self
 !sub|subs|subscribe|residentdj|rdj - Will give info about being a sub and how to get RDJ

 Keys
 ~ = recommendation
 [] = arg
 **************************************************************************
 **************************************************************************

 */
Array.prototype.contains = function (element) {
    return (this.indexOf(element) > -1);
};
Array.prototype.remove = function (element) {
    if (this.contains(element)) {
        this.splice(this.indexOf(element), 1);
        return true;
    }
    else {
        return false;
    }
};
require('dotenv').load();
var DubAPI = require('dubapi');
var jsonfile = require('jsonfile');
var fs = require('fs');
var os = require("os");
var captainApi = require('node-memecaptain-api');
var httpReq = require('http').request;
// Twitch Stuff
var twitchManager = require('./lib/twitchManager.js');
// Time formatting
var moment = require('moment');
// Redis Manager - handles all of the redis interaction
var redisManager = require('./lib/redisManager.js');
// props Manager
var PropsManager = new require('./lib/propsManager.js');
var propsManager = new PropsManager(redisManager);
// Chat and User Utils
var chatUtils = require('./lib/chatUtils.js');
var userUtils = require('./lib/userUtils.js');
var mediaUtils = require('./lib/mediaUtils.js');
var MessageUtils = require('./lib/messageUtils.js');
// Chat and Command Mangers
var ChatManager = require('./lib/chatManager.js');
var chatManager = new ChatManager();
var CommandManager = require('./lib/commandManager.js');
var commandManager = new CommandManager();

var startTime = Date.now();
function getRuntimeMessage() {
    return timeDifference(Date.now(), startTime);
}

try {
    sendgrid = require('sendgrid')(process.env.CHATLOGS_SENDGRID_KEY);
    zip = require('node-zip')();
}
catch (x) {
    console.log('No SendGrid Key detected, chatlogs wont be recorded.');
}

new DubAPI({
        username: process.env.DT_LOGIN,
        password: process.env.DT_PASS
    },
    /**
     * @param err
     * @param {DubAPI} bot
     * */
    function (err, bot) {
        // keymetrics
        require('./lib/keymetrics.js').keymetrics(bot);
        var BotUtils = require('./lib/botUtils.js');
        var botUtils = new BotUtils(bot);
        require('./commands.js')(commandManager);

        var currentName = "";
        var currentID = "";
        var currentType = "";
        var currentDJ = null;
        var currentDJName = "";
        var currentStream = "";
        var neonCat = true;
        var lastChat = {
            userID: 0,
            id: 0
        };
        var userCooldown = [];
        var cooldown = (process.env.COOLDOWN == undefined ? 30 : process.env.COOLDOWN); // Cooldown in seconds
        var imgTime = (process.env.IMGTIME == undefined ? 15 : process.env.IMGTIME); // Cooldown in seconds
        var imgRemovalDubs_Amount = (process.env.IMAGEREMOVALDUBS_AMOUNT == undefined ? 10 : process.env.IMAGEREMOVALDUBS_AMOUNT);
        var imgRemovalDubs_Time = (process.env.IMAGEREMOVALDUBS_TIME == undefined ? 5 : process.env.IMAGEREMOVALDUBS_TIME);
        var lastMediaFKID = "",
            currentMediaPermaLink = undefined;

        if (err) {
            return console.error(err);
        }
        console.log("------------------------   NightBlueBot  -------------------------------------");
        console.log("------------------------ CREATED BY ZUBOHM -----------------------------------");

        if (sendgrid !== null) {
            setupChatlogs(bot);
        }

        function connect() {
            bot.connect(process.env.DT_ROOM);
        }

        bot.on('connected', function (name) {
            console.log('Connected to ' + name);
        });

        bot.on('disconnected', function (name) {
            console.log('Disconnected from ' + name);
            setTimeout(connect, 15000);
        });

        bot.on('error', function (err) {
                console.error(err);
        });

        bot.on(bot.events.roomPlaylistUpdate, function (data) {
            if (data !== undefined) {
                if (data.media == undefined) {
                    return;
                }
                lastMediaFKID = currentID;
                currentName = data.media.name;
                currentID = data.media.fkid;
                currentType = data.media.type;
                // Save song time
                redisManager.getLastSong(function (result) {
                    if (result) {
                        if (result == currentID) {
                            // Don't let it do anything if the song has not changed
                            return;
                        }
                        redisManager.setLastSongTime(result, Date.now());
                    }
                    redisManager.setLastSong(currentID);
                });
                // Save Props
                if (currentDJ) {
                    var props = propsManager.onSongChange(currentDJ.id);
                    if (props) {
                        var propss = 'prop';
                        if (props > 1) {
                            propss += 's';
                        }
                        bot.sendChat('#' + currentDJ.username + ' got ' + props + ' ' + propss + ' for the song they just played.');
                    }
                }
                else {
                    propsManager.resetProps();
                }
                if (data.user) {
                    currentDJ = data.user;
                }
                else {
                    currentDJ = null;
                }
                currentDJName = (data.user == undefined ? "404usernamenotfound" : (data.user.username == undefined ? "404usernamenotfound" : data.user.username));
                if (currentType == "soundcloud") {
                    currentStream = data.media.streamURL;
                    currentMediaPermaLink = "not found (?!) or something went wrong";
                    var soundcloudAccountId = process.env.SC_CLIENT_ID;
                    if (soundcloudAccountId) {
                        httpReq({
                            hostname: 'api.soundcloud.com',
                            path: '/tracks/' + currentID + '?client_id=' + soundcloudAccountId,
                            method: 'GET'
                        }, function (res) {
                            var data = '';
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                data += chunk;
                            });
                            res.on('error', function (x) {
                                console.error(x);
                            });
                            res.on('end', function () {
                                currentMediaPermaLink = JSON.parse(data).permalink_url;
                            });
                        }).end();
                    }
                }
                else {
                    currentMediaPermaLink = 'https://youtube.com/watch?v=' + currentID;
                }
            }
        });

        function getTargetName(target) {
            return target == undefined ? "" : (target.indexOf('@') == 0 ? target : '@' + target);
        }

        bot.on(bot.events.chatMessage, function(data) {
            // Setup Utils!
            var messageUtils = new MessageUtils(bot, redisManager, twitchManager, propsManager, chatUtils, userUtils, mediaUtils, botUtils, data);
            messageUtils.currentMediaPermaLink = currentMediaPermaLink;
            messageUtils.currentDJ = currentDJ;
            if (typeof data === "undefined" || typeof data.user === "undefined") {
                // It won't crash now.
                bot.reconnect();
                return;
            }
            chatManager.processChat(messageUtils, commandManager);
        });

        bot.on(bot.events.chatMessage, function (data) {
            // Make sure the damn bot doesn't damn crash damnit.
            if (typeof data === "undefined" || typeof data.user === "undefined") {
                console.log("Data is undefined");
                // It won't crash now.
                bot.reconnect();
                return 1;
            }
            try {
                if (data.user.id == lastChat.userID) {
                    data.id = lastChat.id;
                }
                else {
                    lastChat.id = data.id;
                    lastChat.userID = data.user.id;
                }
                if (/\@NightBlueBot (rock|paper|scissors)/gi.test(data.message)) {
                    var rps = ['rock', 'paper', 'scissors'],
                        pick = Math.floor(Math.random() * rps.length);
                    bot.sendChat('@' + data.user.username + ' ' + ['rock', 'paper', 'scissors'][pick]);
                }
                var thisUser = data.user.username;
                if (userCooldown.contains(thisUser)) {
                    return 1;
                }
                else if (data.user.role == null && data.message.indexOf('!') != -1) {
                    userCooldown.push(thisUser);
                    setTimeout(function () {
                        userCooldown.remove(thisUser);
                    }, cooldown * 1000);
                }
                else if (data.user.role == null) {
                }
                else if (bot.roles[data.user.role].type == "resident-dj" && data.message.indexOf('!') != -1) {
                    userCooldown.push(thisUser);
                    setTimeout(function () {
                        userCooldown.remove(thisUser);
                    }, cooldown * 1000 * 0.5);
                }
                // Non Commands -- Bot Responses to tagging her.
                if (data.message.indexOf("NightBlueBot") != -1) {
                    // Responses
                    if (data.message.indexOf("make me some food") != -1 || data.message.indexOf("make me some noodles") != -1) {
                        bot.sendChat("@" + thisUser + " make your own damn food!");
                    }
                    else if (data.message.indexOf("who made you") != -1) {
                        bot.sendChat("@zubohm of course!");
                    }
                    else if (data.message.indexOf("are you real") != -1) {
                        bot.sendChat("@" + thisUser + " yes I am real.");
                    }
                    else if (data.message.indexOf("are you human") != -1) {
                        bot.sendChat("@" + thisUser + " no, I'm a robot with AI functionality.");
                    }
                    else if (data.message.indexOf("what can you do") != -1) {
                        bot.sendChat("@" + thisUser + " Lots of things, including your mom :kappa:");
                    }
                    else if (data.message.indexOf("are you a fan of nightblue3") != -1) {
                        bot.sendChat("@" + thisUser + " I love NB3 <3!");
                    }
                    else if (data.message.indexOf("how old are you") != -1) {
                        bot.sendChat("Well, @" + thisUser + ", I've currently been running for " + getRuntimeMessage().replace(" ago", "") + ".");
                    }
                    else if (data.message.indexOf("you are sexy") != -1) {
                        bot.sendChat("How do you know that, @" + thisUser + "??");
                    }
                    else if (data.message.indexOf("call 911") != -1) {
                        bot.sendChat("*Beep Boop* 9-1-1 how may I help you? *Beep Boop*");
                    }
                    else if (data.message.indexOf("what's your opinion on matt") != -1) {
                        bot.sendChat("@" + thisUser + " me and Matt are in a domestic partnership, I love him with all of my circuits.");
                    }
                    else if (data.message.indexOf("gender") != -1) {
                        bot.sendChat("@" + thisUser + " I am female!");
                    }
                    else if (data.message.indexOf("reservations") != -1) {
                        bot.sendChat("*Beep Boop* I've made you reservations for Friday at Noon.");
                    }
                    else if (data.message.indexOf("what do you think about the death of your fellow friend?") != -1) {
                        bot.sendChat("I really don't care, never liked him anyways (plus he was winning me in botwars)");
                    }
                    else if (data.message.indexOf("how late") != -1) {
                        var d = new Date();
                        var formatted_time = time_format(d);
                        bot.sendChat("At this moment it is: " + formatted_time);
                    }
                    else if (data.message.indexOf("answer me") != -1) {
                        bot.sendChat('@' + thisUser + ' I am.');
                    }
                }
                if (data.message.indexOf("isn't that right") != -1 && data.message.indexOf("NightBlueBot") != -1 && data.user.username == "zubohm") {
                    bot.sendChat("That's right, creator! :)")
                }
                else if (data.message.indexOf("@NightBlueBot o/") != -1) {
                    bot.sendChat("@" + thisUser + " o/");
                }
                else if (data.message.indexOf("@NightBlueBot who's your daddy?") != -1) {
                    bot.sendChat("@" + thisUser + " @zubohm is my daddy");
                }
                if (/.*this.*new.*plug.*/i.test(data.message)) {
                    bot.sendChat('@' + thisUser + ' http://imgur.com/uG1wSj3');
                }
                if (data.message == "!hello") {
                    var secretChance = Math.floor(Math.random() * 100) === 0;
                    if(secretChance) {
                        bot.sendChat('@' + thisUser + ' hello...');
                        setTimeout(function() { bot.sendChat("... it's me..."); }, 4500)
                    } else bot.sendChat("Hi There, @" + data.user.username);
                }
                else if (data.message.split(" ")[0] == "!setcd") {
                    if (bot.roles[data.user.role].rights.contains("ban")) {
                        if (data.message.split(" ")[1] == undefined) {
                            return 1;
                        }
                        var input = isNaN(data.message.split(" ")[1]);
                        if (!input) {
                            cooldown = data.message.split(" ")[1];
                            bot.sendChat("@" + thisUser + " set cooldown to " + data.message.split(" ")[1] + " seconds.");
                        }
                    }
                }
                else if (data.message.split(" ")[0] == "!setimgtime") {
                    if (bot.roles[data.user.role].rights.contains("ban")) {
                        if (data.message.split(" ")[1] == undefined) {
                            return 1;
                        }
                        var input = isNaN(data.message.split(" ")[1]);
                        if (!input) {
                            imgTime = data.message.split(" ")[1];
                            bot.sendChat("@" + thisUser + " set image removal time to " + data.message.split(" ")[1] + " seconds.");
                        }
                    }
                }
                else if (data.message.split(" ")[0] == "!meme") {
                    var meme = data.message.replace("!meme ", "");
                    if (meme.indexOf("why not") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("why not", "");
                        captainApi.createMeme('kzsGfQ', 'WHY NOT', bottom)
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("one does not simply") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("one does not simply", "");
                        captainApi.createMeme('da2i4A', 'ONE DOES NOT SIMPLY', bottom)
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("too damn high") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var top = meme.replace("too damn high", "");
                        captainApi.createMeme('RCkv6Q', top, "too damn high")
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("I DONT KNOW") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("I DONT KNOW", "");
                        captainApi.createMeme('sO-Hng', 'I DONT KNOW', bottom)
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("not sure if") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("not sure if", "");
                        captainApi.createMeme('CsNF8w', 'not sure if', bottom)
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("confesion bear") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("confesion bear", "");
                        captainApi.createMeme('hJpgDA', '', bottom)
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("that'd be great") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("that'd be great", "");
                        captainApi.createMeme('q1cQXg', bottom, 'that\'d be great')
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                    else if (meme.indexOf("and at this point i'm too afraid to ask") != -1) {
                        bot.sendChat("@" + thisUser + " generating meme..");
                        var bottom = meme.replace("and at this point i'm too afraid to ask", "");
                        captainApi.createMeme('bIbwgQ', bottom, 'and at this point i\'m too afraid to ask')
                            .then(function (memeUrl) {
                                // use generated meme
                                bot.sendChat(memeUrl + ".jpg");
                            }, function (err) {
                                // handle error
                                console.log(err);
                            });
                    }
                }


                else if (data.message == "!" + thisUser) {
                    bot.sendChat("@" + thisUser + " is an awesome dude! <3 :)");
                }
            }
            catch (x) {
                //bot.sendChat('uh oh, something went wrong :S');
                console.log('uh oh, something went wrong | timestamp: ' + new Date().toString());
                console.error(x);
                console.log('---------------------------')
            }
        });
        connect();
    });

function setupChatlogs(API) {
    var lastChatlogContents = null,
        lastSongID = null,
        lastDJUsername = null;

    function getToday() {
        return new Date(new Date().toDateString() + ' 00:00:00')
    }
    function forceSaveLogs() {
        if (lastChatlogContents) {
            console.log('Hold on a second, saving chatlogs');
            fs.writeFileSync('chatlogs.txt', lastChatlogContents, 'utf8');
        }
    }

    /* Setup file (Reading & checking if it exists) */
    fs.readFile('chatlogs.txt', 'utf8', function (err, contents) {
        if (err) {
            if (err.code !== 'ENOENT') {
                console.error(err);
                return;
            }
            console.log("chatlogs.txt doesn't exists, making it");
            fs.writeFile('chatlogs.txt', lastChatlogContents = 'Chat Logs - ' + getToday().toString() + '\r\n', 'utf8', function (err1) {
                if (err1) {
                    console.log('Error creating chatlogs.txt');
                    return console.error(err1);
                }
                console.log('Done creating chatlogs.txt')
            });
        }
        if (!lastChatlogContents) {
            lastChatlogContents = contents;
        }

        function addChatLog(str) {
            var prefix = new Date().toTimeString().split(' ')[0] + ' | ';
            lastChatlogContents += '\r\n' + prefix + str;
            fs.writeFile('chatlogs.txt', lastChatlogContents, 'utf8');
        }

        /* Setup events */
        API.on(API.events.chatMessage, function (data) {
            if (!data || !data.user) {
                return;
            }
            var role;
            try {
                role = API.roles[data.user.role].label;
            }
            catch (x) {
                role = 'Pleb';
            }
            addChatLog('(' + role + ') ' + data.user.username + ': ' + data.message);
        });
        API.on(API.events.roomPlaylistUpdate, function (data) {
            if (!data.media || !data.user) {
                return;
            } // wut?
            if (data.media.id === lastSongID) {
                return;
            }
            lastSongID = data.media.id;
            lastDJUsername = data.user.username;
            addChatLog('[System] Current Song is ' + data.media.name + '. DJ is ' + data.user.username);
        });
        API.on(API.events.chatSkip, function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] Song queued by ' + lastDJUsername + ' was skipped by ' + data.user.username);
        });
        API.on('room_playlist-queue-reorder', function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] ' + data.user.username + ' reordered the Queue.');
        });
        API.on('room_playlist-queue-remove-user-song', function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] ' + data.user.username + ' removed a song queued by ' + data.removedUser.username + ' from the Queue.');
        });
        API.on('room_playlist-queue-remove-user', function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] ' + data.user.username + ' cleared ' + data.removedUser.username + "'s queue.");
        });
        API.on('user-pause-queue-mod', function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] ' + data.mod.username + ' removed ' + data.user.username + ' from the Queue.');
        });
        API.on('room-lock-queue', function (data) {
            if (!data || !data.user) {
                return;
            }
            addChatLog('[System] ' + data.user.username + ' ' + (data.room.lockQueue ? 'locked' : 'unlocked') + " the room's Queue");
        });

        function chatLogSystemEvent(data) {
            if (!data || !data.user) {
                return;
            }
            var user = data.user.username,
                mod = data.mod.username,
                type = '', suffix = '';
            switch (data.type) {
                case 'user-ban':
                    type = 'banned';
                    break;
                case 'user-unban':
                    type = 'unbanned';
                    break;
                case 'user-kick':
                    type = 'kicked out of the room';
                    break;
                case 'user-mute':
                    type = 'muted';
                    break;
                case 'user-unmute':
                    type = 'unmuted';
                    break;
                case 'user-setrole':
                case 'user-unsetrole':
                    var roleLabel;
                    try {
                        roleLabel = API.roles[data.user.role].label;
                    }
                    catch (x) {
                        roleLabel = 'Pleb';
                    }
                    type = 'made';
                    suffix = 'a ' + roleLabel;
                    break;
            }
            addChatLog('[System] ' + mod + ' ' + type + ' ' + user + ' ' + suffix);
        }
        API.on(API.events.userBan, chatLogSystemEvent);
        API.on(API.events.userUnban, chatLogSystemEvent);
        API.on(API.events.userKick, chatLogSystemEvent);
        API.on(API.events.userMute, chatLogSystemEvent);
        API.on(API.events.userUnmute, chatLogSystemEvent);
        API.on(API.events.userSetRole, chatLogSystemEvent);
        API.on(API.events.userUnsetRole, chatLogSystemEvent);

        API.on('error', forceSaveLogs);
        API.on('connected', function (roomName) {
            addChatLog('[BOT] Connected to ' + roomName);
        });
        API.on('disconneted', function (roomName) {
            addChatLog('[BOT] Disconnected from ' + roomName);
        });

        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM']
            .forEach(function (sig) {
                process.on(sig, function () {
                    if (typeof sig === "string") {
                        forceSaveLogs();
                        process.exit(1);
                    }
                });
            });
    });
}

function roughSizeOfObject(object) {
    var objectList = [];
    var recurse = function (value) {
        var bytes = 0;
        if (typeof value === 'boolean') {
            bytes = 4;
        }
        else if (typeof value === 'string') {
            bytes = value.length * 2;
        }
        else if (typeof value === 'number') {
            bytes = 8;
        }
        else if (
            typeof value === 'object' && objectList.indexOf(value) === -1
        ) {
            objectList[objectList.length] = value;
            for (var i in value) {
                bytes += 8; // an assumed existence overhead
                bytes += recurse(value[i])
            }
        }
        return bytes;
    };
    return recurse(object);
}

function timeDifference(newTime, oldTime) {
    return moment(oldTime).from(newTime);
}

function time_format(d) {
    var hours = format_two_digits(d.getHours());
    var minutes = format_two_digits(d.getMinutes());
    var seconds = format_two_digits(d.getSeconds());
    return hours + ":" + minutes + ":" + seconds;
}

function format_two_digits(n) {
    return n < 10 ? '0' + n : n;
}
