"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -*- coding: utf-8 -*-

//
//    This file is part of scipm.
//
//    scipm is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    scipm is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with scipm.  If not, see <http://www.gnu.org/licenses/>
//

/**
 * scipm
 * @module scipm
 */

/**
 * @file lib/cli.js
 * @author Alban Minassian
 * @version 0.1.2
 * @license GPL-3.0
 */

var projectPackage = _interopRequire(require("../package"));

var dashdash = _interopRequire(require("dashdash"));

var buildCmd = _interopRequire(require("./command/build"));

var winston = _interopRequire(require("winston"));

var shelljs = _interopRequire(require("shelljs"));

var path = _interopRequire(require("path"));

var cli = function cli(cliArgv) {

    // arguments options
    var options = [{
        name: "version",
        type: "bool",
        help: "Print scipm version and exit."
    }, {
        names: ["help", "h"],
        type: "bool",
        help: "Print this help and exit."
    }, {
        names: ["nocolor", "c"],
        type: "bool",
        help: "Disable console color.",
        "default": false
    }, {
        names: ["verbose", "v"],
        type: "arrayOfBool",
        help: "Verbose output. Use multiple times for more verbose."
    }, {
        names: ["lua", "l"],
        type: "string",
        help: "full path to SciTEStartup.lua (default : \"" + path.resolve(process.env.HOME, "SciTEStartup.lua") + "\")",
        helpArg: "FILE",
        helpWrap: false,
        "default": path.resolve(process.env.HOME, "SciTEStartup.lua")
    }, {
        names: ["project", "p"],
        type: "string",
        help: "full path to scipm project (default : \"" + path.resolve(process.cwd()) + "\")",
        helpArg: "DIR",
        helpWrap: false,
        "default": path.resolve(process.cwd())
    }];

    var commands = ["build"];
    var command, output;

    var parser = dashdash.createParser({ options: options });

    var opts = parser.parse(cliArgv);
    // console.log("# opts:", opts);
    // console.log("# args:", opts._args);

    // winston
    // -------------------------------------------------------------------------
    // logger.silly("hello silly"); -vvv
    // logger.debug("hello debug"); -vv
    // logger.verbose("hello verbose"); -v
    // logger.info("hello info");
    // logger.warn("hello warn");
    // logger.error("hello error");
    // -------------------------------------------------------------------------
    var consoleOptions = {};
    consoleOptions.colorize = true;
    if (opts.nocolor === true) {
        consoleOptions.colorize = false;
    }
    if (opts.hasOwnProperty("verbose")) {
        if (opts.verbose.length > 2) {
            consoleOptions.level = "silly";
        }
        if (opts.verbose.length === 2) {
            consoleOptions.level = "debug";
        }
        if (opts.verbose.length === 1) {
            consoleOptions.level = "verbose";
        }
    }
    var logger = new winston.Logger({
        transports: [new winston.transports.Console(consoleOptions)]
    });

    // ``--help`` or ``-h``
    // -------------------------------------------------------------------------
    if (opts.help || opts._args.length === 1 && opts._args[0] === "help") {
        // Use `parser.help()` for formatted options help.
        var help = parser.help({ includeEnv: true, indent: 0 }).trimRight();
        return {
            code: 0,
            level: "info",
            output: "usage: scipm [OPTIONS] [COMMAND]\noptions:\n" + help + "\n\ncommand:\nbuild                build scipm project to SciTEStartup.lua\n" };
    }

    // version ``--version``
    // -------------------------------------------------------------------------
    if (opts.version) {
        return { code: 0, level: "info", output: "" + projectPackage.version };
    }

    // test file SciTEStartup.lua
    // -------------------------------------------------------------------------
    if (!shelljs.test("-f", opts.lua)) {
        output = "file " + opts.lua + " not exist";
        logger.error(output);
        return { code: 1, level: "error", test: output };
    }

    // test scipm project path
    // -------------------------------------------------------------------------
    if (!shelljs.test("-d", opts.project)) {
        output = "directory " + opts.project + " not exist";
        logger.error(output);
        return { code: 1, level: "error", test: output };
    }

    // test [COMMAND]
    // -------------------------------------------------------------------------
    if (opts._args.length === 0) {
        output = "[COMMAND] required (scipm --help)";
        logger.error(output);
        return { code: 1, level: "error", test: output };
    }
    if (opts._args.length > 1) {
        output = "only one [COMMAND] required (scipm --help)";
        logger.error(output);
        return { code: 1, level: "error", test: output };
    }
    command = opts._args[0];
    if (commands.indexOf(command) < 0) {
        output = "unknow command (scipm --help)";
        logger.error(output);
        return { code: 1, level: "error", test: output };
    }

    // switch command
    // -------------------------------------------------------------------------
    if (command === "build") {
        return buildCmd(opts, logger);
    }
};

module.exports = cli;