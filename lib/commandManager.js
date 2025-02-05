'use strict';

class CommandManager {}

CommandManager.prototype.Command = function Command(id, names, cooldown, roles, permissions, funk) {
    this.id = id;
    this.names = names; // String[]
    this.cooldown = cooldown; // int seconds
    this.roles = roles; // String[]
    this.permissions = permissions; // String[]
    this.funk = funk; // function(utils)
};

var commandList = [];
var commands = [];

var CommandListElement = function(commandId, commandAliases, action) {
    this.commandId = commandId;
    this.commandAliases = commandAliases;
    this.action = action;
};

/**
 * @param {MessageUtils} utils
 */
function getCommandName(utils) {
    return utils.getMessage().split(" ")[0].replace('!', '');
}

/**
 * @param {MessageUtils} utils
 * @param {Command} command
 */
function checkPermission(utils, command) {
    command.permissions.forEach(function(permission) {
        if(!utils.bot.hasPermission(utils.getUser(), permission)) {
            return false;
        }
    });
    return true;
}

/**
 * @param {MessageUtils} utils
 * @param {Command} command
 */
function checkRole(utils, command) {
    if (!command.roles.length) {
        // No roles means all can use it!
        return true;
    }
    var ret = false;
    var bot = utils.bot;
    var user = utils.getUser();
    command.roles.forEach(function(role) {
        // ret ? true : bool // If true stay true else check
        //noinspection FallThroughInSwitchStatementJS
        switch (role) {
            case 'resident-dj':
            case '5615feb8e596154fc2000002':
                // RDJ+
                ret = ret ? true : bot.isResidentDJ(user);
            case 'vip':
            case '5615fe1ee596154fc2000001':
                // VIP+
                ret = ret ? true : bot.isVIP(user);
            case 'mod':
            case '52d1ce33c38a06510c000001':
                // Mod+
                ret = ret ? true : bot.isMod(user);
            case 'manager':
            case '5615fd84e596150061000003':
                // Manager+
                ret = ret ? true : bot.isManager(user);
            case 'co-owner':
            case '5615fa9ae596154a5c000000':
                // Owner/Creator only
                ret  = ret ? true : bot.isOwner(user) || bot.isCreator(user);
        }
        if (ret) {
            // if anything matches return true!
            return ret;
        }
    });
    // if we reach here it's false
    return ret;
}

/**
 * @param {MessageUtils} utils
 * @param {Command} command
 */
function isAllowed(utils, command) {
    return checkPermission(utils, command) && checkRole(utils, command);
}

/**
 * @param {MessageUtils} utils
 * @param {Command} command
 */
function runCommand(utils, command) {
    // Set for the uppers to stop now so a command may tell it to keep going
    utils.reply.stop();
    try {
        command.funk(utils);
    }
    catch (err) {
        console.error("Well we had an error! Command: " + command.id);
        console.error(err);
    }
}

/**
 * @param {MessageUtils} utils
 */
CommandManager.prototype.processCommand = function(utils) {
    var commandName = getCommandName(utils);
    var commandListElement = null;
    commandList.forEach(function(element) {
        if (!commandListElement) {
            if (element.commandAliases.contains(commandName)) {
                commandListElement = element;
            }
        }
    });
    if (!commandListElement) {
        return;
    }
    var command = commands[commandListElement.commandId];
    if (!command) {
        // just an extra bit of error checking
        return;
    }
    // make sure that they are allowed to use the command
    if (!isAllowed(utils, command)) {
        // if not allowed
        return;
    }
    var cooldown = utils.settingsManager.calulateCooldown(utils, command);
    if (commandListElement.action || cooldown >= 0) {
        // ok so just run it we did all we needed to do
        runCommand(utils, command);
    }
    else {
        utils.redisManager.getUserCommandCooldown(utils.getUserId(), function(onCooldown) {
            if (onCooldown) {
                return;
            }
            utils.redisManager.setUserCommandCooldown(utils.getUserId(), cooldown);
            runCommand(utils, command);
        });
    }
};

CommandManager.prototype.getCommandList = function() {
    return commandList.slice(0);
};

CommandManager.prototype.getCommand = function(commandId) {
    return commands[commandId];
};

/**
 * @param {Command} command
 */
CommandManager.prototype.addCommand = function(command) {
    var commandListElement = new CommandListElement(command.id, command.names, command.cooldown == 0);
    if (commandList.contains(commandListElement)) {
        return false;
    }
    commandList.push(commandListElement);
    commands[command.id] = command;
    return true;
};

/**
 * @param {String} command
 * @param {Command} command
 */
CommandManager.prototype.removeCommand = function(command) {
    var commandId = null;
    if (command instanceof Command) {
        if (commands.contains(command)) {
            commands.remove(command);
            commandId = command.id;
        }
    }
    else if (typeof command === 'string') {
        var Rcommand = commands[command];
        if (Rcommand) {
            commands.remove(Rcommand);
            commandId = Rcommand.id;
        }
    }
    if (commandId) {
        commandList.forEach(function(commandListElement) {
            if (commandListElement.commandId == commandId) {
                commandList.remove(commandListElement);
            }
        });
        // not sure what to do if we don't find it
    }
};

module.exports = CommandManager;
