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
 * @file lib/command/build.js
 * @author Alban Minassian
 * @version 0.1.1
 * @license GPL-3.0
 */

import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import js2lua from 'js2lua';
import moment from 'moment';
import projectPackage from '../../package';

import JaySchema from 'jayschema';

import scipmChildSchemaJson from '../../schema/scipmchild.0.1.0.schema.json';

var jaySchema = new JaySchema();
var SCHEMADRAFT4 = 'http://json-schema.org/draft-04/schema#';
var resultSchemaValidate;

// http://stackoverflow.com/questions/1779858/how-do-i-escape-a-string-for-a-shell-command-in-nodejs-v8-javascript-engine
var escapeshell = function(cmd) {
  return cmd.replace(/(["\s'$`\\])/g,'\\$1');
};

var build = function(options, logger) {

    logger.silly(JSON.stringify(options, null, 4));

    // var
    // -------------------------------------------------------------------------
    var message;
    var allPackageJsonEnabled = {};
    var listScipmPackageNameEnabled = [];
    var scipmPackageJsonMasterFilePath = path.join(options.project, "package.json")
    var scipmPackageJsonMasterPath = options.project; // REMOVE / RENAME ...
    var sciteExtLuaDirectory = path.join(scipmPackageJsonMasterPath, "node_modules"); // dirname(package.json )/node_modules

    // test if path options.project contains file package.json
    // -------------------------------------------------------------------------
    if (!fs.existsSync(scipmPackageJsonMasterFilePath)) {
        message = `scipm project "${options.project} has no package.json"`;
        logger.error(message);
        return {code: 1, level: "error", message};
    }

    // read master package.json
    // -------------------------------------------------------------------------
    var scipmPackageJsonMaster = require(scipmPackageJsonMasterFilePath);


    // get dependencies in master package.json
    // -------------------------------------------------------------------------
    var dependencies = scipmPackageJsonMaster.dependencies;
    logger.silly("dependencies", JSON.stringify(dependencies, null, 4));

    // for each "dependencies" test if node_modules/<dependencies>/package.json has node ``scipmchild``
    // -------------------------------------------------------------------------
    for (let dependencie in dependencies){

        // avoid scipm package named ``scipm.data`` or ``scipm.core``
        if (dependencie === 'scipm.data' ) {
            logger.error(`✖ "${dependencie}" name not allow ! exclude ...`);
            islistScipmPackageNameEnabled = false;
        }
        if (dependencie === 'scipm.core' ) {
            logger.error(`✖ "${dependencie}" name not allow ! exclude ...`);
            islistScipmPackageNameEnabled = false;
        }

        var packageFilePath = path.join(scipmPackageJsonMasterPath, 'node_modules', dependencie, 'package.json');
        var islistScipmPackageNameEnabled = true; // hope a child scipm package

        // test if node_modules/<dependencies>/package.json exist
        if ((islistScipmPackageNameEnabled === true) && (!fs.existsSync(packageFilePath ))) {
            logger.error(`✖ " ${dependencie}" as  a no file "${packageFilePath}" ! exclude ...`);
            islistScipmPackageNameEnabled = false;
        }

        // read node_modules/<package>/package.json
        if (islistScipmPackageNameEnabled === true) {
            try {
                var depPackage = require(packageFilePath);
            } catch (err) {
                logger.error(`✖ "${dependencie}" as "${packageFilePath}" which is not json ! exclude ...`);
                islistScipmPackageNameEnabled = false;
            }
        }

        // test required ``dependencies`` node
        if ((islistScipmPackageNameEnabled === true) && (!depPackage.hasOwnProperty("dependencies"))) {
            islistScipmPackageNameEnabled = false;
            logger.error(`✖ exclude "${dependencie}" : missing node "dependencies" into "${path.join('node_modules', dependencie, 'package.json')}"`);
        }

        // test if ``scipm`` in node ``dependencies`` (force scipm dependencies to help search www)
        if ((islistScipmPackageNameEnabled === true) && (Object.keys(depPackage.dependencies).indexOf("scipm") < 0)) {
            islistScipmPackageNameEnabled = false;
            logger.error(`✖ exclude "${dependencie}" : missing "scipm" into node "dependencies" into "${path.join('node_modules', dependencie, 'package.json')}"`);
        }

        // test required ``scipmchild`` node
        if ((islistScipmPackageNameEnabled === true) && (!depPackage.hasOwnProperty("scipmchild"))) {
            islistScipmPackageNameEnabled = false;
            logger.error(`✖ exclude "${dependencie}" :  missing node "scipmchild" into "${path.join('node_modules', dependencie, 'package.json')}"`);
        }

        // validate schema node ``scipmchild``
        if (islistScipmPackageNameEnabled === true) {
            resultSchemaValidate = jaySchema.validate(depPackage.scipmchild, scipmChildSchemaJson);
            if (resultSchemaValidate.length !== 0) {
                islistScipmPackageNameEnabled = false;
                logger.error(`✖ exclude "${packageFilePath}" : is not a valid child scipm module  into "${path.join('node_modules', dependencie, 'package.json')}"\n${JSON.stringify(resultSchemaValidate, null, 4)}`);
            } else {
                    //  scipm child ;-)
                    listScipmPackageNameEnabled.push(dependencie)
                    allPackageJsonEnabled[dependencie] = depPackage;
            }
        }

    }
    logger.debug("scipm package enabled :" + listScipmPackageNameEnabled.join(", "));
    logger.silly(JSON.stringify(allPackageJsonEnabled, null, 4));

    // list lua dll
    // -------------------------------------------------------------------------
    var luaRequire = {};
    for (let scipmPackageName of listScipmPackageNameEnabled) {
        for (let luaRequirePackage of allPackageJsonEnabled[scipmPackageName].scipmchild.luaRequire) {
            if (!luaRequire.hasOwnProperty(luaRequirePackage)) { luaRequire[luaRequirePackage] = []; }
            luaRequire[luaRequirePackage].push(scipmPackageName);
        }
    }
    logger.debug("luaRequire", JSON.stringify(luaRequire, null, 4))

    // scipm.config
    // -------------------------------------------------------------------------
    var scipmData = {};
    scipmData.path = {
        scipmproject : escapeshell(options.project),
        scipmchild: escapeshell(path.join(options.project, 'node_modules')),
        sep: '/',
    }
    if (process.platform === 'win32') {
        scipmData.path.sep = `\\`; // => js2lua => "\\"
    }
    scipmData.listscipmchild = {}; // scipm package child
    _.each(listScipmPackageNameEnabled, function(scipmPackageName) {
        scipmData.listscipmchild[scipmPackageName] = true;
    })
    scipmData.ilistscipmchild = []; // scipm package child (ordered)
    _.each(listScipmPackageNameEnabled, function(scipmPackageName, key) {
        scipmData.ilistscipmchild.push(scipmPackageName);
    })
    scipmData.startupInfo = {
        "countError": 0,
        "countLoaded": 0,
        "countNotLoaded": 0,
        "countWarning": 0,
        "package": {}
    }
    _.each(listScipmPackageNameEnabled, function(scipmPackageName, key) {
        scipmData.startupInfo.package[scipmPackageName] = {
            loaded: false,
            countScipmDependencieError: 0,
            countWarning: 0,
            countError: 0,
            warning: [],
            error: [],
        }
    })

    scipmData.package = {}; // package info
    _.each(listScipmPackageNameEnabled, function(scipmPackageName) {
        scipmData.package[scipmPackageName] = {
            version: allPackageJsonEnabled[scipmPackageName].version,
            name: allPackageJsonEnabled[scipmPackageName].name,
            description: allPackageJsonEnabled[scipmPackageName].description,
            luaReportExtend: allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.luaReportExtend,
            infoLuaFunctions: allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.infoLuaFunctions,
            infoFiles: allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.infoFiles,
            infoProps: allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.infoProps,
            action: {},
            iaction: [] // ordered action
        }
        if (Object.keys(allPackageJsonEnabled[scipmPackageName].scipmchild.actions).length > 0) {
            _.each(allPackageJsonEnabled[scipmPackageName].scipmchild.actions, function(action, keyAction) {
                scipmData.package[scipmPackageName].iaction.push(keyAction);
                scipmData.package[scipmPackageName].action[keyAction] = {
                    title: action.title,
                    description: action.description,
                    pattern: action.pattern,
                    // patternjoin: action.pattern.join(";"),
                    toolsmenu : { allow: action.addToolsMenu.allow }
                }
                if ( action.addToolsMenu.allow === true) {
                    scipmData.package[scipmPackageName].action[keyAction].toolsmenu.context = action.addToolsMenu.addContextMenu;
                    scipmData.package[scipmPackageName].action[keyAction].toolsmenu.command = {
                        idx: null, // updated later
                        subsystem: action.addToolsMenu.command.subsystem,
                        shortcuts: action.addToolsMenu.command.shortcuts,
                        cmd: action.addToolsMenu.command.cmd,
                        isFilter: action.addToolsMenu.command.isFilter,
                        saveBefore: action.addToolsMenu.command.saveBefore,
                        input: action.addToolsMenu.command.input,
                        replaceSelection: action.addToolsMenu.command.replaceSelection,
                        quiet: action.addToolsMenu.command.quiet,
                        mode: action.addToolsMenu.command.mode
                    }
                }
            })
        }
    });

    // SciTEStartup.lua
    // -------------------------------------------------------------------------
    var scitestartup = [];
    scitestartup.push(`-- -*- coding: utf-8 -`);
    scitestartup.push(`-- ---------------------------------------------------------------------------`);
    scitestartup.push(`-- WARNING! All changes made in this file will be lost!`);
    scitestartup.push(`-- ---------------------------------------------------------------------------`);
    scitestartup.push(`-- SciTEStartup.lua`);
    scitestartup.push(`-- Created: ${moment().format('YYYY/MM/DD, HH:mm:ss')}`);
    scitestartup.push(`--     by: scipm (version ${projectPackage.version})`);
    scitestartup.push(`-- ---------------------------------------------------------------------------`);
    scitestartup.push(``);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- go`)
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`)
    scitestartup.push(`print('✈ load "'.. props["ext.lua.startup.script"] .. '" build by scipm v${projectPackage.version}')`);
    scitestartup.push(``);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- scipm namespace (global)`)
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`)
    scitestartup.push(`scipm = {}`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- add data`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm["data"] = ${js2lua.convert(scipmData, 0)}`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- add core function`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm["core"] = {}`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.Try/scipm.core.Catch`);
    scitestartup.push(`-- usage : \`\`scipm.core.Try { function() error('oops'); end, scipm.core.Catch { function(error) print('caught error: ' .. error); end} } \`\``)
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.Catch = function (what) return what[1]; end`);
    scitestartup.push(`scipm.core.Try = function (what) status, result = pcall(what[1]); if not status then what[2](result); end return result; end`);

    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.AddWarning`);
    scitestartup.push(`-- usage : \`\`scipm.core.AddWarning(scipmchildKey, message)\`\``)
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.AddWarning = function (scipmchildKey, message)`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][scipmchildKey] then`);
    scitestartup.push(`        table.insert(scipm["data"]["startupInfo"]["package"][scipmchildKey]["warning"], message)`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["package"][scipmchildKey]["countWarning"] =  1 + scipm["data"]["startupInfo"]["package"][scipmchildKey]["countWarning"];`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["countWarning"] =  1 + scipm["data"]["startupInfo"]["countWarning"];`);
    scitestartup.push(`    else`);
    scitestartup.push(`        print("scipmAddWarning :: UNKNOW PACKAGE " .. scipmchildKey)`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.AddError`);
    scitestartup.push(`-- usage : \`\`scipm.core.AddError(scipmchildKey, message)\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(` scipm.core.AddError = function (scipmchildKey, message)`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][scipmchildKey] then`);
    scitestartup.push(`        table.insert(scipm["data"]["startupInfo"]["package"][scipmchildKey]["error"], message)`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["package"][scipmchildKey]["countError"] =  1 + scipm["data"]["startupInfo"]["package"][scipmchildKey]["countError"];`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["countError"] =  1 + scipm["data"]["startupInfo"]["countError"];`);
    scitestartup.push(`    else`);
    scitestartup.push(`        print("scipm.core.AddError :: UNKNOW PACKAGE " .. scipmchildKey)`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.PackageNotLoaded`);
    scitestartup.push(`-- usage : \`\`scipm.core.PackageNotLoaded(scipmchildKey, message)\`\``)
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.PackageNotLoaded = function (scipmchildKey, message)`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][scipmchildKey] then`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["package"][scipmchildKey]["loaded"] =  false;`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["countNotLoaded"] =  1 + scipm["data"]["startupInfo"]["countNotLoaded"];`);
    scitestartup.push(`        scipm.core.AddError(scipmchildKey, message) -- and add message error`);
    scitestartup.push(`    else`);
    scitestartup.push(`        print("scipm.core.PackageNotLoaded :: UNKNOW PACKAGE " .. scipmchildKey)`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.PackageLoaded`);
    scitestartup.push(`-- usage : \`\`scipm.core.PackageLoaded(scipmchildKey)\`\``)
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.PackageLoaded = function (scipmchildKey)`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][scipmchildKey] then`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["package"][scipmchildKey]["loaded"] =  true;`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["countLoaded"] =  1 + scipm["data"]["startupInfo"]["countLoaded"];`);
    scitestartup.push(`    else`);
    scitestartup.push(`        print("scipm.core.PackageLoaded :: UNKNOW PACKAGE " .. scipmchildKey)`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.TestPackageDependencie`);
    scitestartup.push(`-- usage : \`\`scipm.core.TestPackageDependencie(packageName, dependpackageName)\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.TestPackageDependencie = function (packageName, dependpackageName)`);
    scitestartup.push(`    -- set \`\`messageError\`\` if dependpackageName not found`);
    scitestartup.push(`    local messageError = nil;`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][dependpackageName] then`);
    scitestartup.push(`        if scipm["data"]["startupInfo"]["package"][dependpackageName]["loaded"] == false then`);
    scitestartup.push(`            messageError = dependpackageName .. " not loaded before " .. packageName;`);
    scitestartup.push(`        end`);
    scitestartup.push(`    else`);
    scitestartup.push(`        messageError = "\'" .. packageName .. "\' depend of \'" .. dependpackageName .. "\' which not in master package.json (scipm install \`\`" .. dependpackageName .. "\`\`)" ;`);
    scitestartup.push(`    end`);
    scitestartup.push(`    -- swith \`\`messageError\`\``);
    scitestartup.push(`    if messageError ~= nil then`);
    scitestartup.push(`        scipm["data"]["startupInfo"]["package"][packageName]["countScipmDependencieError"] = 1 + scipm["data"]["startupInfo"]["package"][packageName]["countScipmDependencieError"]; -- inc`);
    scitestartup.push(`        scipm.core.PackageNotLoaded(packageName, messageError); -- tell which scipm module not loaded and add error message`);
    scitestartup.push(`        return false;`);
    scitestartup.push(`    else`);
    scitestartup.push(`        return true;`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.printInfoPackage`);
    scitestartup.push(`-- usage : \`\`scipm.core.printInfoPackage(packageName)\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.printInfoPackage = function (packageName)`);
    scitestartup.push(`    if scipm["data"]["listscipmchild"][packageName] then`);
    scitestartup.push(`        print('-------------------------------------------------------------------------------------------------')`);
    scitestartup.push(`        print('-- ' .. packageName)`);
    scitestartup.push(`        print('-------------------------------------------------------------------------------------------------')`);
    scitestartup.push(`        print("description   : " .. scipm["data"]["package"][packageName]["description"]);`);
    scitestartup.push(`        print("version       : " .. scipm["data"]["package"][packageName]["version"]);`);
    scitestartup.push(`        if (table.getn(scipm["data"]["package"][packageName]["infoLuaFunctions"]) > 0) then`);
    scitestartup.push(`            print("")`);
    scitestartup.push(`            print("functions     : ")`);
    scitestartup.push(`            print("-----------------------------------------------------------")`);
    scitestartup.push(`            table.foreach(scipm["data"]["package"][packageName]["infoLuaFunctions"], function(key, value)`);
    scitestartup.push(`                -- scipm.vardump(value)`);
    scitestartup.push(`                print("* " .. value.name);`);
    scitestartup.push(`            end)`);
    scitestartup.push(`        end`);
    scitestartup.push(`        if (table.getn(scipm["data"]["package"][packageName]["iaction"]) > 0) then`);
    scitestartup.push(`            print("")`);
    scitestartup.push(`            print("actions       : ")`);
    scitestartup.push(`            print("-----------------------------------------------------------")`);
    scitestartup.push(`            table.foreach(scipm["data"]["package"][packageName]["action"], function(key, value) -- scipm.vardump(value)`);
    scitestartup.push(`                if (value.toolsmenu.allow == true) then`);
    scitestartup.push(`                    local line = "* " .. value.title;`);
    scitestartup.push(`                    if (value.toolsmenu.command.shortcuts ~= nil) then line = line .. " (" .. value.toolsmenu.command.shortcuts .. ")" end`);
    scitestartup.push(`                    print(line);`);
    scitestartup.push(`                end`);
    scitestartup.push(`            end)`);
    scitestartup.push(`        end`);
    scitestartup.push(`        if (table.getn(scipm["data"]["package"][packageName]["infoFiles"]) > 0) then`);
    scitestartup.push(`            print("")`);
    scitestartup.push(`            print("files         : ")`);
    scitestartup.push(`            print("-----------------------------------------------------------")`);
    scitestartup.push(`            table.foreach(scipm["data"]["package"][packageName]["infoFiles"], function(key, value)`);
    scitestartup.push(`                scipm.core.PrintWithHiddenDoString('* ' .. table.concat(value.path, scipm.data.path.sep), 'scite.Open("' .. table.concat({scipm.data.path.scipmchild, packageName}, scipm.data.path.sep) .. scipm.data.path.sep .. table.concat(value.path, scipm.data.path.sep) .. '");editor:GrabFocus();')`);
    scitestartup.push(`            end)`);
    scitestartup.push(`        end`);
    scitestartup.push(`        if (table.getn(scipm["data"]["package"][packageName]["infoProps"]) > 0) then`);
    scitestartup.push(`            print("")`);
    scitestartup.push(`            print("props SciTE[Global|User|Directory|].properties : ")`);
    scitestartup.push(`            print("-----------------------------------------------------------")`);
    scitestartup.push(`            table.foreach(scipm["data"]["package"][packageName]["infoProps"], function(key, value)`);
    scitestartup.push(`                print("* " .. value.name .. "=" .. value.value  .. " (default=" .. value.default .. ") ".. value.description );`);
    scitestartup.push(`            end)`);
    scitestartup.push(`        end`);
    scitestartup.push(`    else`);
    scitestartup.push(`        print("scipm.core.printInfoPackage :: UNKNOW PACKAGE " .. packageName)`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.GetStringWithHiddenDoString`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.GetStringWithHiddenDoString return string \`\`[message]...spaces...scipmHiddenDoString=[luaDoString]\`\``);
    scitestartup.push(`-- usage   : \`\`scipm.core.GetStringWithHiddenDoString(message, luaDoString)\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.GetStringWithHiddenDoString = function (message, luaDoString)`);
    scitestartup.push('    luaDoString = string.gsub(luaDoString, "%\\\\", "%\\\\\\\\"); -- escape char ``\\`` by ``\\\\``'); // luaDoString = string.gsub(luaDoString, "%\\", "%\\\\"); -- escape char ``\`` by ``\\"``
    scitestartup.push(`    return message .. string.rep(' ', 500) .. 'scipmHiddenDoString=' ..  luaDoString`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.PrintWithHiddenDoString`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.PrintWithHiddenDoString print output \`\`[message]...spaces...scipmHiddenDoString=[luaDoString]\`\``);
    scitestartup.push(`-- usage  : \`\`scipm.core.PrintWithHiddenDoString(message, luaDoString)\`\``);
    scitestartup.push(`-- example: \`\`scipm.core.PrintWithHiddenDoString('hello', 'x = {["aaa"] => "bbb"}; _ALERT("hello"); runThisFunc()')\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.PrintWithHiddenDoString = function (message, luaDoString)`);
    scitestartup.push(`    print(scipm.core.GetStringWithHiddenDoString(message, luaDoString));`);
    scitestartup.push(`end`);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`-- scipm.core.EvalHiddenDoString`);
    scitestartup.push(`-- search \`\`scipmHiddenDoString=\`\` and eval lua code after.`);
    scitestartup.push(`--     Example :  \`\`scipmHiddenDoString=x=10\`\` to set var \`\`x\`\` with value \`\`10\`\``);
    scitestartup.push(`--     Example :  \`\`scipmHiddenDoString=_ALERT("hello")\`\` print \`\`hello\`\` in scite output`);
    scitestartup.push(`-- usage : \`\`scipm.core.EvalHiddenDoString(line)\`\``);
    scitestartup.push(`-- example : \`\`scipm.core.EvalHiddenDoString("fakefakefakefake  scipmHiddenDoString=x=10")\`\` return \`\`{["eval"] = true, ["why"] ="42"}\`\``);
    scitestartup.push(`-- note : arg \`\`line\`\` can be generate with \`\`scipm.core.PrintWithHiddenDoString\`\``);
    scitestartup.push(`-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
    scitestartup.push(`scipm.core.EvalHiddenDoString = function (line)`);
    scitestartup.push(`    if line ~= nil then`);
    scitestartup.push(`        local pos = string.find(line, 'scipmHiddenDoString=', 1); -- print(pos)`);
    scitestartup.push(`        if pos ~= nil then`);
    scitestartup.push(`            pos = pos + string.len("scipmHiddenDoString="); -- print(pos)`);
    scitestartup.push(`            local hiddenLua = string.sub(line, pos); -- print(hiddenLua)`);
    scitestartup.push(`            -- scipm.core.Try { function()`);
    scitestartup.push(`                dostring(hiddenLua)`);
    scitestartup.push(`                return { ["eval"] = true, ["why"] = "42" }`);
    scitestartup.push(`            -- end,`);
    scitestartup.push(`            -- scipm.core.Catch {`);
    scitestartup.push(`            --     function(error)`);
    scitestartup.push(`            --         print("caught error: can't eval " .. hiddenLua);`);
    scitestartup.push(`            --         return { ["eval"] = false, ["why"] = "dostring throw an error"}; <=== why alway return \`\`nil\`\` ?`);
    scitestartup.push(`            --     end}`);
    scitestartup.push(`            -- }`);
    scitestartup.push(`        else`);
    scitestartup.push(`            return { ["eval"] = false, ["why"] = "not found \`\`scipmHiddenDoString=\`\` string" };`);
    scitestartup.push(`        end`);
    scitestartup.push(`    else`);
    scitestartup.push(`        return { ["eval"] = false, ["why"] = "nil arg"};`);
    scitestartup.push(`    end`);
    scitestartup.push(`end`);
    if (Object.keys(luaRequire).length > 0) {
        scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
        scitestartup.push(`-- Require lua module needed by scipm package`);
        scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
        scitestartup.push(`local catchErrorRequire = false;`);
        scitestartup.push(`scipm.core.ExplainRequireError = function (strError, strLuaRequire, strPackageList)`);
        scitestartup.push(`    catchErrorRequire = true;`);
        scitestartup.push(`    print("caught error: " .. strError)`);
        scitestartup.push(`    print('--------------------------------------------------------------')`);
        scitestartup.push(`    print('- scipm package \`\`' .. strPackageList .. '\`\` require lua module \`\`' .. strLuaRequire .. '\`\` but SciTE/lua not found it')`);
        scitestartup.push(`    print('- install this lua module required by this scipm package')`);
        scitestartup.push(`    print('- or verify your PATH to use this lua module and restart SciTE')`);
        scitestartup.push(`    print('- or try LuaRocks : http://lua-users.org/wiki/LuaRocks')`);
        scitestartup.push(`    print('- or remove scipm package (' .. strPackageList .. ') which require this lua module')`);
        scitestartup.push(`end`);
        _.each(luaRequire, function(listScipmPackage, keyLuaRequire) {
            scitestartup.push(`scipm.core.Try {`);
            scitestartup.push(`    function()`);
            scitestartup.push(`        ${keyLuaRequire.replace(/\./g, '_')} = require "${keyLuaRequire}";`);
            scitestartup.push(`    end,`);
            scitestartup.push(`    scipm.core.Catch {`);
            scitestartup.push(`        function(error)`);
            scitestartup.push(`            scipm.core.ExplainRequireError(error, '${keyLuaRequire}', '${listScipmPackage.join(", ")}');`);
            scitestartup.push(`        end`);
            scitestartup.push(`    }`);
            scitestartup.push(`}`);
        });
        scitestartup.push(`if catchErrorRequire == true then`);
        scitestartup.push(`    print('--------------------------------------------------------------')`);
        scitestartup.push(`    print('fail to exec \`\`' .. props["ext.lua.startup.script"] .. '\`\` created by \`\`scipm\`\`')`);
        scitestartup.push(`    print('find require error, scipm not continue => EXIT')`);
        scitestartup.push(`    return false;`);
        scitestartup.push(`end`);
        scitestartup.push(``);
    }
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- props`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`props["scipm.data.path.scipmproject"] = scipm["data"]["path"]["scipmproject"];`);
    scitestartup.push(`props["scipm.data.path.scipmchild"] = scipm["data"]["path"]["scipmchild"];`);
    scitestartup.push(`props["scipm.data.path.sep"] = scipm["data"]["path"]["sep"];`);
    scitestartup.push(``);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- Lua code in node scipmchild.SciTEStartup of each node_modules/<module>/package.json`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    _.each(listScipmPackageNameEnabled, function(scipmPackageName) {

        // read lua code
        var rawLua = allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.raw;
        if ( allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup._use === "filePath") {
            var filePath = path.join(options.project, "node_modules", scipmPackageName, allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.filePath);
            var rawLua = fs.readFileSync(filePath, 'utf8')
        }

        scitestartup.push(`--  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
        scitestartup.push(`-- ${scipmPackageName}`);
        scitestartup.push(`--  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`);
        if(Object.keys(allPackageJsonEnabled[scipmPackageName].scipmchild.scipmDependencies).length > 0) {
            scitestartup.push(`-- -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -`);
            scitestartup.push(`-- this scipm package depend another scipm package, just test scipm["data"]["startupInfo"]["package"][dependpackage]["loaded"]`);
            scitestartup.push(`-- \`\`scipm.core.TestPackageDependencie()\`\` test scipm["data"]["startupInfo"]["package"][dependpackage]["loaded"]`);
            scitestartup.push(`-- if \`\`scipm.core.TestPackageDependencie()\`\` detect not loaded dependencie then`);
            scitestartup.push(`-- set scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["loaded"] at false`);
            scitestartup.push(`-- and scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["error"] to { "hoops, package need another package"}`);
            scitestartup.push(`-- and increment scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["countScipmDependencieError"]`);
            scitestartup.push(`-- and not increment scipm["data"]["startupInfo"]["countLoaded"]`);
            scitestartup.push(`-- and increment scipm["data"]["startupInfo"]["countError"]`);
            scitestartup.push(`-- -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -`);
            _.each(allPackageJsonEnabled[scipmPackageName].scipmchild.scipmDependencies, function(value, scipmPackageNameHope ) {
                scitestartup.push(`scipm.core.TestPackageDependencie("${scipmPackageName}", "${scipmPackageNameHope}") -- for package ARG1 test if package ARG2 is already loaded (ARG1 depend of ARG2)`);
            });
        }
        // code of package
        scitestartup.push(`-- -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -`);
        scitestartup.push(`-- load package if no dependencies error`);
        if(Object.keys(allPackageJsonEnabled[scipmPackageName].scipmchild.scipmDependencies).length == 0) {
            scitestartup.push(`-- [info] this package as no dependencie, so scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["countScipmDependencieError"] always at zero`);
        }
        scitestartup.push(`-- -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -`);
        scitestartup.push(`if scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["countScipmDependencieError"] == 0 then`);
        scitestartup.push(``);
        scitestartup.push(`    scipm.core.Try { function()`);
        scitestartup.push(`        -- info to remember : `);
        scitestartup.push(`        -- scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["loaded"] = false, use \`\`when child package auto detect AND thrown an error \`\`error("oops") to be catch here, which exec scipm.core.PackageNotLoaded() and set this value to false;\`\``);
        scitestartup.push(`        -- scipm["data"]["startupInfo"]["package"]["${scipmPackageName}"]["warning"] = {}, use \`\`scipmAddWarning("${scipmPackageName}", "hello my another warning")\`\` to add warning`);
        scitestartup.push(``);
        if ( allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup._use === "no") {
            // pass
        } else if ( allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup._use === "dofile") {

            if (allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.dofile.length === 0) {
                logger.error(`✖ "${scipmPackageName}" as no dofile (length =0)`);
                process.exit(1);
            }

            var tmpDofile = [];
            for (let item of allPackageJsonEnabled[scipmPackageName].scipmchild.SciTEStartup.dofile) {
                tmpDofile.push(`, "${item}"`)
            }

            scitestartup.push(`        local doFilePath = table.concat({scipm.data.path.scipmchild, "${scipmPackageName}"${tmpDofile.join("")}}, scipm.data.path.sep); -- _ALERT(doFilePath)`);
            scitestartup.push(`        dofile(doFilePath);`);
        } else { // _use === "raw" || _use === "filePath"
            scitestartup.push(`        -- inject lua code (in ${scipmPackageName}/package.json, see node \`\`scipmchild.SciTEStartup\`\`)`);
            scitestartup.push(`        -- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
            scitestartup.push(rawLua);
            scitestartup.push(`        -- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
        }
        scitestartup.push(``);
        scitestartup.push(`        scipm.core.PackageLoaded("${scipmPackageName}"); -- ok, increment scipm["data"]["startupInfo"]["countLoaded"]`);
        scitestartup.push(``);
        scitestartup.push(`    end,`);
        scitestartup.push(`    scipm.core.Catch {`);
        scitestartup.push(`        function(error)`);
        scitestartup.push(`            -- print("caught error: " .. error);`);
        scitestartup.push(`            scipm.core.PackageNotLoaded("${scipmPackageName}", error); -- add error (not increment scipm["data"]["startupInfo"]["countLoaded"])`);
        scitestartup.push(`        end}`);
        scitestartup.push(`    }`);
        scitestartup.push(``);
        scitestartup.push(`end`);
    });
    scitestartup.push(``);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- add tool menu action (and context)`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(fs.readFileSync(__dirname + '/assets/toolmenu.lua', 'utf8'));
    scitestartup.push(`scipm.core.toolmenu();`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- if extman then listen output double click (and eval dostring hidden in line)`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`if scite_OnDoubleClick then`);
    scitestartup.push(`    scite_OnDoubleClick(function()`);
    scitestartup.push(`        if (output.Focus) then -- not editor.Focus  -- test click into editor or output`);
    scitestartup.push(`            if (output.CurrentPos > 0) then`);
    scitestartup.push(`                lineOutput = output:GetLine(output:LineFromPosition(output.CurrentPos))`);
    scitestartup.push(`                if (lineOutput ~= nil) then`);
    scitestartup.push(`                    scipm.core.EvalHiddenDoString(lineOutput)`);
    scitestartup.push(`                end`);
    scitestartup.push(`            end`);
    scitestartup.push(`        end`);
    scitestartup.push(`    end)`);
    scitestartup.push(`end`);
    scitestartup.push(``);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`-- The End`);
    scitestartup.push(`-- ----------------------------------------------------------------------------------------------------------------------------`);
    scitestartup.push(`scipm.core.startupInfo = function ()`);
    if (listScipmPackageNameEnabled.length > 0) {
        scitestartup.push(`    -- scipm.vardump(scipm["data"]["startupInfo"])`);
        scitestartup.push(`    local title = "scipm: "; local message;`);
        scitestartup.push(`    title = title .. scipm["data"]["startupInfo"]["countLoaded"] .. "/${listScipmPackageNameEnabled.length} packages loaded";`);
        scitestartup.push(`    if scipm["data"]["startupInfo"]["countError"] > 0 then`);
        scitestartup.push(`        title = title .. ", " .. scipm["data"]["startupInfo"]["countError"] .. " errors";`);
        scitestartup.push(`    end`);
        scitestartup.push(`    if scipm["data"]["startupInfo"]["countWarning"] > 0 then`);
        scitestartup.push(`        title = title .. ", " .. scipm["data"]["startupInfo"]["countWarning"] .. " warnings";`);
        scitestartup.push(`    end`);
        scitestartup.push(`    print("--------------------------------------------------------------------------------")`);
        scitestartup.push(`    print("-- " .. title)`);
        scitestartup.push(`    -- list package loaded or not`);
        scitestartup.push(`    for index, scipmchildKey in ipairs(scipm.data.ilistscipmchild) do`);
        scitestartup.push(`        if scipm["data"]["startupInfo"]["package"][scipmchildKey]["loaded"] == true then`);
        scitestartup.push(`                message = "-- [✓] " .. scipmchildKey`);
        scitestartup.push(`                if scipm["data"]["package"][scipmchildKey]["luaReportExtend"] ~= nil then`);
        scitestartup.push(`                    scipm.core.PrintWithHiddenDoString(message .. " (+)", scipm["data"]["package"][scipmchildKey]["luaReportExtend"]);`);
        scitestartup.push(`                else`);
        scitestartup.push(`                    print(message);`);
        scitestartup.push(`                end`);
        scitestartup.push(`        else`);
        scitestartup.push(`                message = "-- [✖] " .. scipmchildKey;`);
        scitestartup.push(`                if scipm["data"]["package"][scipmchildKey]["luaReportExtend"] ~= nil then`);
        scitestartup.push(`                    scipm.core.PrintWithHiddenDoString(message .. " (+)", scipm["data"]["package"][scipmchildKey]["luaReportExtend"]);`);
        scitestartup.push(`                else`);
        scitestartup.push(`                    print(message);`);
        scitestartup.push(`                end`);
        scitestartup.push(`        end`);
        scitestartup.push(`    end`);
        scitestartup.push(`    -- list error by package`);
        scitestartup.push(`    if scipm["data"]["startupInfo"]["countError"] > 0 then`);
        scitestartup.push(`        print("--------------------------------------------------------------------------------")`);
        scitestartup.push(`        print(scipm["data"]["startupInfo"]["countError"] .. " errors :")`);
        scitestartup.push(`        for index, scipmchildKey in ipairs(scipm.data.ilistscipmchild) do`);
        scitestartup.push(`            if scipm["data"]["startupInfo"]["package"][scipmchildKey]["countError"] > 0 then`);
        scitestartup.push(`                print("  \'" .. scipmchildKey .. "\' as " .. scipm["data"]["startupInfo"]["package"][scipmchildKey]["countError"] .. " errors")`);
        scitestartup.push(`                table.foreach(scipm["data"]["startupInfo"]["package"][scipmchildKey]["error"], function(key, message)`);
        scitestartup.push(`                print("    - " .. message)`);
        scitestartup.push(`                end) -- end table.foreach`);
        scitestartup.push(`            end`);
        scitestartup.push(`        end`);
        scitestartup.push(`    end`);
        scitestartup.push(`    -- list warning by package`);
        scitestartup.push(`    if scipm["data"]["startupInfo"]["countWarning"] > 0 then`);
        scitestartup.push(`        print("--------------------------------------------------------------------------------")`);
        scitestartup.push(`        print(scipm["data"]["startupInfo"]["countWarning"] .. " warnings :")`);
        scitestartup.push(`        for index, scipmchildKey in ipairs(scipm.data.ilistscipmchild) do`);
        scitestartup.push(`            if scipm["data"]["startupInfo"]["package"][scipmchildKey]["countWarning"] > 0 then`);
        scitestartup.push(`                print("  \'" .. scipmchildKey .. "\' as " .. scipm["data"]["startupInfo"]["package"][scipmchildKey]["countWarning"] .. " warnings")`);
        scitestartup.push(`                table.foreach(scipm["data"]["startupInfo"]["package"][scipmchildKey]["warning"], function(key, message)`);
        scitestartup.push(`                print("    - " .. message)`);
        scitestartup.push(`                end) -- end table.foreach`);
        scitestartup.push(`            end`);
        scitestartup.push(`        end`);
        scitestartup.push(`    end`);
    } else {
        scitestartup.push(`    print("-- scipm : no package loaded")`);
    }
    scitestartup.push(`    print("--------------------------------------------------------------------------------")`);
    scitestartup.push(`end`);
    scitestartup.push(`scipm.core.startupInfo();`);

    // write SciTEStartup.lua
    var filePathSciTEStartup = options.lua;
    fs.writeFileSync(filePathSciTEStartup, scitestartup.join("\n"), 'utf-8');
    logger.info("write " + filePathSciTEStartup);
    return {code: 0, level: 'info', test: 'ok'};

}

export default build;