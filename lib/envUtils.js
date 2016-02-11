"use strict";

var fs = require("fs");
var path = require("path");
var envFile = ".env";

class EnvUtils {};

EnvUtils.prototype.exists = function() {
    let file;

    file = path.join(__dirname, envFile);
    return fs.existsSync(file);
};

module.exports = new EnvUtils();
