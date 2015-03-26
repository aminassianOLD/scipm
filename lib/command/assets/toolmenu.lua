scipm.core.toolmenu = function ()

    -- vars
    local actionToAddInToolMenu = {};
    local actionToAddInContextMenu = {};
    local subsystem = { ["console"] =  "0", ["windows"] = "1", ["shellexec"] = "2", ["luadirector"] = "3", ["htmlhelp"] = "4", ["winhelp"] = "5", ["immediate"] = "7" }
    local addedAction = {};  -- list of action  added
    local notAddedAction = {};  -- list of action  not added (more than 49)
    local withContextMenuAction = false;
    local withNotAddedAction = false;
    local menucontextuel = {};
    local userContextmenu = "";
    local idxMenu = 0;

    -- list action allow to add in toolmenu or context menu
    local idxActionToAddInToolMenu = 1;
    for index1, packageName in ipairs(scipm.data.ilistscipmchild) do -- print(index1, packageName)
        for index2, actionName in ipairs(scipm.data.package[packageName].iaction) do -- print("-", index2, actionName)
            if scipm["data"]["startupInfo"]["package"][packageName]["loaded"] == true then
                if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["allow"] == true then
                    actionToAddInToolMenu[idxActionToAddInToolMenu] = { ["package"] = packageName, ["action"] = actionName }
                    if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["context"] == true then
                        actionToAddInContextMenu[idxActionToAddInToolMenu] = { ["package"] = packageName, ["action"] = actionName }
                    end
                    idxActionToAddInToolMenu = idxActionToAddInToolMenu + 1;
                end
            end
        end
    end

    -- set new tool menu
    -- The command number can be in the range of 0 to 49
    for key, value in ipairs(actionToAddInToolMenu) do -- print(key, scipm.vardump(value))

        local packageName = value["package"];
        local actionName = value["action"];

        local filterPattern = table.concat(scipm["data"]["package"][packageName]["action"][actionName]["pattern"], ";")
        if (props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".pattern"] ~= "") then -- swith SciTE[Global|User].properties
            filterPattern = props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".pattern"];
        end

        if idxMenu <= 49 then

            -- save idx
            scipm["data"]["package"][packageName]["action"][actionName]["idx"] = idxMenu;

            -- command.name.number.filepattern
            propKey = 'command.name.'..idxMenu.."." .. filterPattern
            propValue = scipm["data"]["package"][packageName]["action"][actionName]["title"];
            if (props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".title"] ~= "") then -- swith SciTE[Global|User].properties
                propValue = props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".title"];
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.number.filepattern (exec os cmd, lua ...)
            -- Example if subsystem = "luadirector"
            --        propValue ``_ALERT('hello');``
            --        propValue ``dostring _ALERT('hello');``
            --        propValue ``dofile C:\\\\dddd\\\\code.lua``
            propKey = 'command.'..idxMenu.."." .. filterPattern
            propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["cmd"]
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.is.filter.number.filepattern
            propKey = 'command.is.filter.'..idxMenu.."." .. filterPattern;
            if  scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["isFilter"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["isFilter"];
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.subsystem.number.filepattern
            propKey = 'command.subsystem.'..idxMenu.."." .. filterPattern
            propValue = subsystem[scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["subsystem"]] -- write by example "3" (not "luadirector")
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.save.before.number.filepattern
            -- If command.save.before is set to 1, SciTE automatically saves the file before execution
            --  If it is set to 2, SciTE will not save the file
            --  otherwise SciTE asks you. On Windows
            propKey = 'command.save.before.'..idxMenu.."." .. filterPattern
            if  scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["saveBefore"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["saveBefore"];
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.input.number.filepattern
            -- On Windows, the command.input property is only supported for subsystem 0 ("command" line programs).
            -- the optional command.input property specifies text that will be piped to the command
            -- This may reference other properties; for example, command.input.0.*.cc=$(CurrentSelection) would pipe the current selection to the command processes
            propKey = 'command.input.'..idxMenu.."." .. filterPattern
            if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["input"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["input"];
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.replace.selection.number.filepattern
            -- The optional command.replace.selection can be used to specify that the command output should replace the current selection (or be inserted at the cursor location, if there is no selection)
            -- 0, the default, means do not replace the selection
            -- 1 means replace the selection when the command finishes (If the user cancels the command via "Tools / Stop Executing", the selection will not be replaced even in mode 1)
            -- 2 means replace the selection only if the command finishes with an exit code of 0
            propKey = 'command.replace.selection.'..idxMenu.."." .. filterPattern
            if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["replaceSelection"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["replaceSelection"];
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.quiet.number.filepattern
            -- supported only on windows is command.quiet
            -- A value of 1 indicates that the command I/O should not be echoed to the output pane (This may be useful in combination with command.input and command.replace.selection)
            if props['PLAT_WIN'] == "1" then
                propKey = 'command.quiet.'..idxMenu.."." .. filterPattern
                if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["quiet"] ~= nil then
                    propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["quiet"];
                else
                    propValue = nil;
                end
                props[propKey] = propValue; -- print(propKey.. "=" .. propValue)
            end

            -- command.mode.number.filepattern
            -- The command.mode property is a comma-separated list of flags / settings. Each mode setting can have an argument, separated from the setting name by a colon. For most of these, the argument portion is optional; if the setting name appears without an argument, this works the same as "setting:yes". If a setting is included in the command.mode but also appears as a separate command property, the mode property will be overridden. Similarly, if a single setting appears more than once with different arguments, the last valid argument takes priority. The supported command.mode settings are:
            -- filter - accepts keyword arguments yes and no
            -- quiet - accepts keyword arguments yes and no
            -- replaceselection - accepts yes, no, and auto
            -- savebefore - accepts yes, no, and prompt
            -- subsystem - console, windows, shellexec, lua, director, winhelp, htmlhelp, immediate
            -- groupundo - yes or no
            propKey = 'command.mode.'..idxMenu.."." .. filterPattern
            if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["mode"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["mode"];
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- command.shortcut.number.filepattern
            propKey = 'command.shortcut.'..idxMenu.."." .. filterPattern
            if scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["shortcuts"] ~= nil then
                propValue = scipm["data"]["package"][packageName]["action"][actionName]["toolsmenu"]["command"]["shortcuts"];
                if (props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".toolsmenu.command.shortcuts"] ~= "") then -- swith SciTE[Global|User].properties
                    propValue = props["scipm.data.package." .. packageName .. ".action." .. actionName .. ".toolsmenu.command.shortcuts"];
                end
            else
                propValue = nil;
            end
            props[propKey] = propValue; -- print(propKey.. "=" .. propValue)

            -- special contextMenu
            -- add attr "idxMenu" inside actionToAddInContextMenu !
            -- tool action always prefix with 11xx
            if actionToAddInContextMenu[key] then -- if
                if idxMenu < 10 then
                    actionToAddInContextMenu[key]["idxMenu"] = "110" .. idxMenu;
                else
                    actionToAddInContextMenu[key]["idxMenu"] = "11" .. idxMenu;
                end
            end

            -- save action added in addedAction
            addedAction[key] = value ; -- list of action  not added (more than 49) in notAddedAction

        else

            -- over limit 49
            withNotAddedAction = true;
            notAddedAction[key] = value ; -- list of action  not added (more than 49) in notAddedAction
            notAddedAction[key]["idxMenu"] =  idxMenu -- add integer idxMenu

        end -- end of ``if idxMenu <= 49 then``

        -- increment idxMenu
        idxMenu = idxMenu + 1;

    end -- end ipair


    -- print('-- addedAction ----------------')
    -- scipm.vardump(addedAction)
    -- print('-- notAddedAction ----------------')
    -- scipm.vardump(notAddedAction)
    -- print('-- actionToAddInContextMenu ----------------')
    -- scipm.vardump(actionToAddInContextMenu)

    -- create context menu
    -- Warning : always after create tool menu (with idxMenu)
    withContextMenuAction = false;
    table.insert(menucontextuel, "|") -- separator
    table.foreach(actionToAddInContextMenu, function(key, value)
        if addedAction[key] ~= nil then -- and only if added in tool menu (and get idxMenu)
            withContextMenuAction = true; --
            local idxMenu = value["idxMenu"]; -- string between 1100, 1149
            local actionName = value["action"];
            local packageName = value["package"];
            local contextSciteCmd = scipm["data"]["package"][packageName]["action"][actionName]["title"] .. "|" .. idxMenu
            table.insert(menucontextuel, contextSciteCmd)
        end
    end) -- end table.foreach
    if withContextMenuAction == true then
        local userContextmenu = table.concat(menucontextuel, "|"); -- _ALERT(userContextmenu)
        props['user.context.menu']= userContextmenu -- and set context menu ;-)
    end

    -- list action not added into tool menu (and context menu)
    if withNotAddedAction == true then
        table.foreach(notAddedAction, function(key, value)

            local packageName = value["package"];
            local actionName = value["action"];
            local title = scipm["data"]["package"][packageName]["action"][actionName]["title"]
            local shortcuts = scipm["data"]["package"][packageName]["action"][actionName]["shortcuts"]
            if shortcuts == nil then shortcuts = "" else shortcuts = " (" .. shortcuts .. ")" end
            local messageWarning = "action " .. title .. shortcuts .. " not installed in tool menu (more than 50 commands)";
            scipm.func.AddWarning("toolmenu", messageWarning);

        end) -- end table.foreach
    end

end