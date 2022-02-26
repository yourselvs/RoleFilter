/**
 * @name RoleFilter
 * @author yourselvs
 * @authorId 110574243023966208
 * @description Filter the user list by selected roles.
 * @authorLink https://github.com/yourselvs
 * @version 1.2.3
 * @website https://github.com/yourselvs/RoleFilter
 * @source https://raw.githubusercontent.com/yourselvs/RoleFilter/main/release/RoleFilter.plugin.js
 * @updateUrl https://raw.githubusercontent.com/yourselvs/RoleFilter/main/release/RoleFilter.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"Role Filter","authors":[{"name":"yourselvs","discord_id":"110574243023966208","github_username":"yourselvs","twitter_username":""}],"version":"1.2.2","description":"Filter the user list by selected roles.","github":"https://github.com/yourselvs/RoleFilter","github_raw":"https://raw.githubusercontent.com/yourselvs/RoleFilter/main/release/RoleFilter.plugin.js"},"changelog":[{"title":"New Feature: Right Click the 'Hide Member List' button.","items":["1.2.2: You can now right click the 'Hide Member List' button to show the filter popuot."]},{"title":"New Feature: Add Any Role","items":["1.2.1 FIX: Fixed memory leak when multiple popouts were opened","Filter on any role by clicking the plus button at the top of the member's list.","Use the search bar to search for a specific role.","This button can be removed completely by toggling it in the settings."]},{"title":"Toggle Roles","type":"improved","items":["Clicking on a role mention or a user's role will toggle, rather than just adding to the filter.","You no longer need to click in the filter area to de-select a role."]},{"title":"New Settings Panel","type":"improved","items":["A settings panel for the plugin has been added.","The warning for large channels and the new button can both be disabled."]},{"title":"Less spam on big servers","type":"fixed","items":["Role Filter has limitations on channels with more than 100 members.","When you filter in a large channel, a warning message will pop up only once, rather than every time you click on a role.","The warning message shows again once you change server/channel."]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
    const { DiscordClasses, DiscordClassModules, DiscordModules, DiscordSelectors, Logger, Patcher, PluginUtilities, Popouts, ReactTools, Settings, Toasts, Tooltip, WebpackModules } = Library;

    const { GuildStore, ChannelStore, SelectedChannelStore, React } = DiscordModules;

    const plusPath = `M 256.00,0.00 C 114.60,0.00 0.00,114.60 0.00,256.00 0.00,397.40 114.60,512.00 256.00,512.00 397.40,512.00 512.00,397.40 512.00,256.00 512.00,114.60 397.40,0.00 256.00,0.00 Z M 377.30,316.50 C 385.70,324.90 385.70,338.50 377.30,346.90 377.30,346.90 346.90,377.30 346.90,377.30 338.50,385.70 324.90,385.70 316.50,377.30 316.50,377.30 255.70,316.50 255.70,316.50 255.70,316.50 194.90,377.30 194.90,377.30 186.50,385.70 172.90,385.70 164.50,377.30 164.50,377.30 134.00,346.90 134.00,346.90 125.60,338.50 125.60,324.90 134.00,316.50 134.00,316.50 194.80,255.70 194.80,255.70 194.80,255.70 134.00,194.80 134.00,194.80 125.60,186.40 125.60,172.80 134.00,164.40 134.00,164.40 164.40,134.00 164.40,134.00 172.80,125.60 186.40,125.60 194.80,134.00 194.80,134.00 255.60,194.80 255.60,194.80 255.60,194.80 316.40,134.00 316.40,134.00 324.80,125.60 338.40,125.60 346.80,134.00 346.80,134.00 377.20,164.40 377.20,164.40 385.60,172.80 385.60,186.40 377.20,194.80 377.20,194.80 316.40,255.60 316.40,255.60 316.40,255.60 377.30,316.50 377.30,316.50 Z`;
    const searchPath = `M3.60091481,7.20297313 C3.60091481,5.20983419 5.20983419,3.60091481 7.20297313,3.60091481 C9.19611206,3.60091481 10.8050314,5.20983419 10.8050314,7.20297313 C10.8050314,9.19611206 9.19611206,10.8050314 7.20297313,10.8050314 C5.20983419,10.8050314 3.60091481,9.19611206 3.60091481,7.20297313 Z M12.0057176,10.8050314 L11.3733562,10.8050314 L11.1492281,10.5889079 C11.9336764,9.67638651 12.4059463,8.49170955 12.4059463,7.20297313 C12.4059463,4.32933105 10.0766152,2 7.20297313,2 C4.32933105,2 2,4.32933105 2,7.20297313 C2,10.0766152 4.32933105,12.4059463 7.20297313,12.4059463 C8.49170955,12.4059463 9.67638651,11.9336764 10.5889079,11.1492281 L10.8050314,11.3733562 L10.8050314,12.0057176 L14.8073185,16 L16,14.8073185 L12.2102538,11.0099776 L12.0057176,10.8050314 Z`;
    const roleFilterCss = `/* Prevent the scrollbar from rendering while the filter is active */
.roleFilterWrap::-webkit-scrollbar { 
    display: none; 
} 

.roleFilter-header {
    padding: 22px 8px 0px 16px;
}

.roleFilter-addBtn { 
    fill: var(--interactive-normal);
    width: 16px;
    height: 20px;
    cursor: pointer;
} 

.roleFilter-addBtn:hover { 
    fill: var(--interactive-hover);
}

.roleFilter-addBtnPath {
    transform: scale(0.03125) rotate(45deg);
    transform-origin: 8px 0px;
}

.roleFilter-popoutContainer {
    width: 250px;
    height: 400px;
    padding: 8px;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-accent);
    background-color: var(--background-primary);
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
}

.roleFilter-listContainer {
    width: 100%;
    height: calc(100% - 46px);
    overflow-y: scroll;
    border-radius: 4px;
}

.roleFilter-listContainer::-webkit-scrollbar { 
    display: none; 
} 

.roleFilter-searchContainer {
    width: 100%;
    background: var(--background-tertiary);
    margin-bottom: 10px;
    border-radius: 4px;
    padding: 1px 0px;
    cursor: text;
}

.roleFilter-searchInput {
    font-size: 16px;
    height: 34px;
    width: calc(100% - 42px);
    padding: 0 8px;
    background: none;
    border: none;
    color: var(--text-normal);
}

.roleFilter-listOption {
    padding: 8px;
    margin-bottom: 8px;
    background: var(--background-secondary);
    border-radius: 4px;
    border: 1px solid transparent;
    transition: 50ms ease-out;
}

.roleFilter-listOption:last-of-type {
    margin-bottom: 0;
}

.roleFilter-listOption.selected {
    background: var(--background-secondary-alt);
    border: 1px solid var(--background-accent);
}

.roleFilter-listOption.selected:hover {
    background: var(--background-tertiary);
    border: 1px solid var(--brand-experiment);
    cursor: pointer;
}

.roleFilter-emptyList {
    padding: 20px;
    text-align: center;
    color: var(--text-muted)
}

.roleFilter-btnContainer {
    width: 100%;
}

.roleFilter-btnPadding {
    padding-bottom: 6px;
}

.roleFilter-role {
    margin: 4px 4px 0px 0px;
}

.roleFilter-searchIcon {
    position: relative;
    top: 4px;
    fill: var(--interactive-normal);
    width: 16px;
    height: 20px;
    cursor: text;
}

.roleFilter-searchPath {
    transform: scale(1.13);
    transform-origin: 16px 4px;
}`;

    const Lists = WebpackModules.getByProps("ListThin");

    const classes = {
        roleRoot: DiscordClassModules.PopoutRoles.root,
        role: `${DiscordClassModules.PopoutRoles.role} ${WebpackModules.getByProps("bodyInnerWrapper").bodyInnerWrapper} interactive roleFilter roleFilter-role`,
        roleCircle: DiscordClassModules.PopoutRoles.roleCircle + " roleFilter",
        roleName: DiscordClassModules.PopoutRoles.roleName + " roleFilter",
        layer: DiscordClassModules.TooltipLayers.layer,
        header: "roleFilter-header",
        popoutContainer: "roleFilter-popoutContainer",
        listContainer: "roleFilter-listContainer",
        listOption: "roleFilter-listOption",
        emptyList: "roleFilter-emptyList",
        searchContainer: "roleFilter-searchContainer",
        searchInput: "roleFilter-searchInput",
        btnContainer: "roleFilter-btnContainer",
        btnPadding: "roleFilter-btnPadding",
        addBtn: "roleFilter-addBtn",
        addBtnPath: "roleFilter-addBtnPath",
        searchIcon: "roleFilter-searchIcon",
        searchPath: "roleFilter-searchPath"
    }

    const memberHeight = 44,
        sectionHeight = 40;

    /**
     * @param {string} id The discord id of the role
     * @param {string} name The name assigned to the role
     * @param {string} color The color assigned to the role
     */
    const Role = class Role {
        constructor(id, name, color) {
            this.id = id;
            this.name = name;
            this.color = color;
        }
    }

    /**
     * @param {string} id The discord id of the channel
     * @param {Member[]} rows Array of Member objects used by discord to construct member list.
     *      (not user defined)
     */
    const Channel = class Channel {
        constructor(id, rows) {
            this.id = id;
            this.rows = rows;
        }
    }

    /**
     * @param {Role[]} roles List of roles in the filter
     * @param {string[]} membersAllowed List of user ids allowed by the filter
     * @param {string[]} sectionsAllowed List of section ids allowed by the filter
     * @param {number} membersFound Number of total members found when searching through filter
     *      Includes members not in the filter
     *      Used for calculating member list container height
     * @param {number} sectionsFound Number of total sections found when searching through filter
     *      Includes sections not in the filter
     *      Used for calculating member list container height
     */
    const Filter = class Filter {
        constructor(roles, membersAllowed, sectionsAllowed, membersFound, sectionsFound) {
            this.roles = roles;
            this.membersAllowed = membersAllowed;
            this.sectionsAllowed = sectionsAllowed;
            this.membersFound = membersFound;
            this.sectionsFound = sectionsFound;
        }
    }

    /**
     * @property {(e) => void} onClick Called when role pill is clicked
     * @property {Role} role Role object to construct role pill from
     */
    const RolePill = class RolePill extends React.Component {

        constructor(props) {
            super(props);
        }
        
        handleClick() {
            this.props.onClick(this.props.role.id);
        }

        render() {
            return React.createElement("div", {
                className: classes.role,
                style: {overflow: "auto"},
                onClick: () => this.handleClick()
            },
                React.createElement("div", {
                    className: classes.roleCircle,
                    style: {
                        backgroundColor: this.props.role.color,
                        // ensure circle has proper width on long role names
                        display: "inline-table"
                    }
                }),
                React.createElement("div", {className: classes.roleName},
                    this.props.role.name
                )
            )
        }
    }

    /**
     * @property {(e) => void} onClick Called when a role pill in the list is clicked
     * @property {Filter} filter The plugin's current filter state
     */
    const RoleFilterList = class RoleFilterList extends React.Component {
        render() {
            const roleFiltersListChildren = this.getRoleFilterListChildren(this.props.filter);

            // if there are no children, return null rather than undefined
            return roleFiltersListChildren ? React.createElement("div", {
                style: { display: "contents" },
                children: roleFiltersListChildren
            }) : null;
        }

        getRoleFilterListChildren(filter) {
            return filter && filter.roles.map(role =>
                React.createElement(RolePill, {
                    role,
                    onClick: this.props.onClick
                })
            );
        }
    }

    /**
     * @property {(e) => void} onClick Called when the add button is clicked
     * @property {boolean} usePadding
     */
    const AddRoleButton = class AddRoleButton extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            let btnContainerClass = `${classes.btnContainer} ${this.props.usePadding && classes.btnPadding}`;
            
            return React.createElement("div", {
                className: btnContainerClass
            }, 
                React.createElement("svg", {
                    className: classes.addBtn,
                    onClick: (e) => this.props.onClick(e)
                },
                    React.createElement("path", {
                        className: classes.addBtnPath,
                        d: plusPath
                    })
                )
            );
        }
    }

    /**
     * @property {() => void} onAddButtonClick Called when the "add role" button is clicked
     * @property {() => void} onRoleClick Called when a role pill in the filter list is clicked
     * @property {Filter} filter The plugin's current filter state
     * @property {boolean} showAddRoleButton
     */
    const RoleHeader = class RoleHeader extends React.Component {
        render() {
            const showPadding = !!(this.props.showAddRoleButton || this.props.filter);
            const containerClass = `${classes.roleRoot} ${showPadding && classes.header}`;

            return React.createElement("div", {
                className: containerClass
            },
                this.props.showAddRoleButton ? React.createElement(AddRoleButton, {
                    onClick: this.props.onAddButtonClick,
                    usePadding: !!this.props.filter
                }) : null,
                React.createElement(RoleFilterList, {
                    filter: this.props.filter,
                    onClick: this.props.onRoleClick,
                })
            );
        }        
    }

    /**
     * @property {() => void} onRoleSelect Called when a role in the popout list is selected
     * @property {() => void} onRoleDeselect Called when a role in the popout list is deselected
     * @property {Role[]} guildRoles List of roles in the currently selected guild
     * @property {Role[]} selectedRoles List of roles applied by the filter
     */
    const RolePopout = class RolePopout extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                searchValue: null
            };
        }

        render() {
            return React.createElement("div", {
                className: `${classes.layer} ${classes.popoutContainer}`
            },
                React.createElement(RoleSearch, {
                    onChange: (e) => this.onSearch(e)
                }),
                React.createElement(RoleList, {
                    onRoleSelect: this.props.onRoleSelect,
                    onRoleDeselect: this.props.onRoleDeselect,
                    guildRoles: this.props.guildRoles,
                    selectedRoles: this.props.selectedRoles,
                    searchValue: this.state.searchValue
                })
            );
        }

        onSearch(event) {
            this.setState({
                searchValue: event.target.value
            });
        }
    }

    /**
     * @property {(string) => void} onChange Called when the input value is changed
     */
    const RoleSearch = class RoleSearch extends React.Component {
        render() {
            return React.createElement("div", {
                className: classes.searchContainer
            },
                React.createElement("input", {
                    className: classes.searchInput,
                    placeholder: "Search Roles",
                    onChange: this.props.onChange,
                    autoFocus: true,
                    onFocus: e => e.target.select()
                }),
                React.createElement("svg", {
                    className: classes.searchIcon,
                    onClick: this.onClick
                },
                    React.createElement("path", {
                        className: classes.searchPath,
                        d: searchPath
                    })
                )
            );
        }
    }

    /**
     * @property {(Role) => void} onRoleSelect Called when a role in the popout list is selected
     * @property {(Role) => void} onRoleDeselect Called when a role in the popout list is deselected
     * @property {Role[]} guildRoles List of roles in the currently selected guild
     * @property {Role[]} selectedRoles List of roles applied by the filter
     * @property {string} searchValue Value that the role names must include to show up in the list
     */
    const RoleList = class RoleList extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                selectedRoles: this.props.selectedRoles
            }
        }

        render() {
            let listChildren = this.getRoleList();
            
            if (listChildren.length === 0) {
                listChildren = this.getEmptyListDisplay();
            }

            return React.createElement("div", {
                className: classes.listContainer,
                children: listChildren
            });
        }

        /**
         * Maps the guild's roles to RoleListOption components.
         * Filters roles to include the searchValue prop in the role's name.
         * Highlights roles that are selected
         * @returns {RoleListOption[]}
         */
        getRoleList() {
            return this.props.guildRoles.map(role => {
                const passesSearch = this.searchRole(role);

                if(!passesSearch)
                    return null;

                const selected = this.state.selectedRoles && 
                    this.state.selectedRoles.some(selectedRole => 
                        selectedRole.id == role.id
                    );

                return React.createElement(RoleListOption, {
                    onClick: (r, s) => this.handleRoleClick(r, s),
                    role,
                    selected
                })
            }).filter(n => n);
        }

        /**
         * Selects or deselects a role that was clicked.
         * @param {Role} role Role object to add to state and filter
         * @param {boolean} selected True if the role is currently selected. False otherwise
         */
        handleRoleClick(role, selected) {
            if (selected)
                this.deselectRole(role);
            else
                this.selectRole(role);
        }

        /**
         * Adds role to the selectedRoles state.
         * Fires callback to add role to plugin state.
         * @param {Role} role Role object to add to state and filter
         */
        selectRole(role) {
            let roles = this.state.selectedRoles;

            if(!roles)
                roles = [];

            roles.push(role);

            this.setState({
                selectedRoles: roles
            });

            this.props.onRoleSelect(role);
        }

        /**
         * Removes role from the selectedRoles state.
         * Fires callback to remove role from plugin state.
         * @param {Role} role Role object to remove from state and filter
         */
        deselectRole(role) {
            let roles = this.state.selectedRoles.filter(selectedRole => {
                return role.id !== selectedRole.id;
            })

            this.setState({
                selectedRoles: roles
            })

            this.props.onRoleDeselect(role);
        }

        /**
         * Checks if a role's name passes the search filter, case-insensitive
         * @param {Role} role Role to validate
         * @returns {boolean} True if role name includes search value, false otherwise
         */
        searchRole(role) {
            if(!this.props.searchValue)
                return true;

            return role.name.toLowerCase().includes(this.props.searchValue.toLowerCase());
        }

        getEmptyListDisplay() {
            return React.createElement('div', {
                className: classes.emptyList
            }, "No roles found.")
        }
    }

    /**
     * @property {(Role, boolean) => void} onClick Called when the option is clicked on
     * @property {Role} role The role to construct the list option from
     * @property {boolean} selected Whether or not the list option is selected in the filter
     */
    const RoleListOption = class RoleListOption extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return React.createElement("div", {
                className: `${classes.listOption} ${this.props.selected ? 'selected': 'interactive'}`,
                style: {
                    color: this.props.role.color
                },
                onClick: () => this.handleClick()
            }, this.props.role.name);
        }

        handleClick() {
            this.props.onClick(this.props.role, this.props.selected);
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.defaultSettings = {};
            this.defaultSettings.showAddRoleButton = true;
            this.defaultSettings.showLargeChannelWarning = true;

            this.useAnd = true;
        }
        
        onStart() {
            this.initializeCss();
            this.patchRoles();
            this.patchMemberList();
            this.patchMemberListButton();
            this.patchRoleMention();
            
            document.addEventListener("click", (e) => this.handleRolePillClick(e), true);
        }

        onStop() {

            document.removeEventListener.bind(document, "click", (e) => this.handleRolePillClick(e), true);
            
            Patcher.unpatchAll();

            this.updateMemberList();

            // Unpatch right-click on memberlist button.
            this.patchMemberListButton(false);
            
            const roleClass = DiscordClassModules.PopoutRoles["role"];

            if(roleClass.includes("interactive")) {
                DiscordClassModules.PopoutRoles["role"] = roleClass.replace(" interactive","");
            }

            if (this.elementToRevertCSS) this.revertFilterCss();

            PluginUtilities.removeStyle("RoleFilterCSS");
        }

        onSwitch() {
            this.resetFilter();
            this.updateMemberList();
            this.patchMemberListButton();
            this.closePopout();
            this.showedWarning = false;
        }

        getSettingsPanel() {
            return Settings.SettingPanel.build(this.saveSettings.bind(this), 
                new Settings.Switch(
                    "Show \"Add Role\" Button", 
                    "Display a button to add roles to the filter at the top of the members list.",
                    this.settings.showAddRoleButton, 
                    (e) => {
                        this.settings.showAddRoleButton = e;
                        this.updateMemberList();
                    }
                ),
                new Settings.Switch(
                    "Show Large Channel Warning", 
                    "When enabled, displays a warning when using Role Filter on channels with 100+ members. Role Filter does not always show all members in channels over 100 members.", 
                    this.settings.showLargeChannelWarning, 
                    (e) => {this.settings.showLargeChannelWarning = e;})
            );
        }

        /**
         * Retrieves, caches, and returns guild id, 
         * which is reset every time guild is changed
         * @returns {number} Last selected Guild ID
         */
        getGuildId() {
            this.guildId = this.guildId || BdApi.findModuleByProps("getLastSelectedGuildId").getLastSelectedGuildId();

            return this.guildId;
        }

        /**
         * Apply plugin css. Supplies css for all custom component classes
         */
        initializeCss() {
            PluginUtilities.addStyle(
                "RoleFilterCSS", 
                roleFilterCss
            );
        }

        /**
         * Turns off the filter and re-renders the member list
         */
        resetFilter() {
            this.guildId = "";
            this.allRoles = null;
            this.filter = null;
            this.updateMemberList();
        }

        /**
         * Make roles interactive
         */
        patchRoles() {
            const roleClass = DiscordClassModules.PopoutRoles["role"];

            if(!roleClass.includes("interactive")) {
                DiscordClassModules.PopoutRoles["role"] += " interactive";
            }
        }

        /**
         * Adds right-click to filter option to member list button.
         */
        patchMemberListButton(patch = true) {
            const elem = document.querySelector('div[aria-label="Hide Member List"]');
            if (!elem) return;

            if (patch) elem.onmousedown = (e) => {
                if (e.which == 3) {
                    this.closePopout();
                    this.openPopout(e.target);
                }
            };
            else elem.onmousedown = () => {};
        }

        /**
         * Renders the role pill when filtering. Watches for channel changes.
         */
        patchMemberList() {
            Patcher.after(Lists.ListThin, "render", (that, args, value) => {
                const [props] = args;
                
                if (!props || !props["data-list-id"] 
                    || !props["data-list-id"].startsWith("members")
                    // make sure the list is actually rendered before proceeding
                    || !value.ref || !value.ref.current) return value;

                const memberListContainer = ReactTools.getOwnerInstance(value.ref.current.parentElement)

                this.patchMemberListContainer(value);

                if (!this.channel || this.channel.id != memberListContainer.props.channel.id) {
                    // Logger.info("Channel change detected.");
                    // if a channel object isn't created, or if the channel has changed, create new channel
                    this.channel = new Channel(
                        memberListContainer.props.channel.id,
                        memberListContainer.props.rows
                    );
                }

                // always insert the element, even when not filtering
                // so that user popout does not close when clicking filter
                if (value) this.insertRoleElem(value);
                
                if (this.filter) this.applyFilterCss(value.ref.current);
                else if (this.elementToRevertCSS) this.revertFilterCss();

                return value;
            });
        }

        /**
         * Makes role mentions clickable, adds to filter
         */
        patchRoleMention() {
            const RoleMention = WebpackModules.getModule(m => m && m.default.displayName === "RoleMention");
            
            Patcher.after(RoleMention, "default", (_, [props], component) => {
                if (!component || !component.props 
                    || !props || props.type !== "mention"
                    || !props.roleId || props.children[0] ==='@everyone') return;

                const role = this.getRoleById(props.roleId);

                component.props.className += " interactive";
                component.props.onClick = (e) => this.toggleRole(role);
            });
        }

        /**
         * Alters the render functions in the member list container to follow filter behavior.
         * @param {React element} memberListElem the member list element
         */
        patchMemberListContainer(memberListElem) {
            const memberList = ReactTools.getOwnerInstance(memberListElem.ref.current.parentElement);
            
            Patcher.after(memberList, "renderRow", (that, args, value) => {
                if (!this.filter || !this.filter.membersAllowed || !value || !value.props || !value.props.user) return value;
                if (!this.filter.membersAllowed.includes(value.props.user.id)) return null;
            });
            Patcher.after(memberList, "renderSection", (that, args, value) => {
                if (!this.filter || !this.filter.sectionsAllowed || !value || !value.props) return value;
                
                // first section will have children, rest wont
                const props = !value.props.children ? value.props : value.props.children.props;

                if (this.filter.sectionsAllowed[props.id]) 
                    // count for each section needs to be manually updated
                    props.count = this.filter.sectionsAllowed[props.id].count;
                else return null;
            });
        }

        /**
         * Apply CSS to the elements which make up the members list.
         * Bypasses lazyload by forcing the container to be as tall 
         * as needed to render all members. Shrinks viewport and
         * makes it scrollable.
         * @param {HTML element} element The members list HTML element
         */
        applyFilterCss(element) {
            const filterElementHeight = element.children[0].offsetHeight,
                totalMemberHeight = this.filter.membersFound * memberHeight,
                totalSectionHeight = this.filter.sectionsFound * sectionHeight,
                filteredMemberHeight = this.filter.membersAllowed.length * memberHeight,
                filteredSectionHeight = Object.keys(this.filter.sectionsAllowed).length * sectionHeight,
                // get the amount of padding there should be at the bottom of the list
                bottomPadding = element.computedStyleMap().get("padding-bottom").value,
                roleButtonHeight = 30;

            // set the list height so that all members are rendered
            element.style.height = filterElementHeight 
                + totalSectionHeight 
                + totalMemberHeight 
                + roleButtonHeight + "px";
            element.style.removeProperty("overflow");

            const parentElement = element.parentElement;

            // set the membersWrap height to the height that all members would be rendered AFTER filtering
            parentElement.style.minHeight = filterElementHeight + filteredMemberHeight + filteredSectionHeight + bottomPadding + "px";
            parentElement.style.overflow = "hidden"

            const containerElement = parentElement.parentElement;

            // set the container to scroll through the list
            containerElement.style.overflowY = "scroll"
            // hide the scrollbar
            containerElement.classList.add("roleFilterWrap");

            this.elementToRevertCSS = element;
        }

        /**
         * Reverts all css adjustments made by applyFilterCss().
         */
        revertFilterCss() {
            const element = this.elementToRevertCSS;

            element.style.removeProperty("height");
            element.style.overflow = "hidden scroll";

            const parentElement = element.parentElement;

            parentElement.style.removeProperty("min-height");
            parentElement.style.removeProperty("overflow");

            const containerElement = parentElement.parentElement;

            containerElement.style.removeProperty("overflow-y");
            containerElement.classList.remove("roleFilterWrap");

            this.elementToRevertCSS = null;
        }

        /**
         * Forces an update on the member list and it's parent element
         */
        updateMemberList() {
            const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
            if (!memberList) return;
            this.forceUpdate(memberList.parentElement);
            this.forceUpdate(memberList);
        }

        /**
         * Gets react instance of an HTML element and forces an update.
         * @param {HTML element} elem 
         */
        forceUpdate(elem) {
            const owner = ReactTools.getOwnerInstance(elem);
            owner.forceUpdate();
            if (owner.handleScroll) owner.handleScroll();
        }

        /**
         * Take a list of role IDs and return information on how to filter by those IDs.
         * @param {Role[]} roles List of IDs to include in the filter
         * @param {boolean} useAnd True to use AND logic, false to use OR
         * @returns {
         *     maxIdx: number,
         *     groupList: {groupId: count of group},
         *     membersList: string[] ,
         *     sectionsFound: number,
         *     membersFound: number 
         * }
         */
        getAllowedMembers(roles, useAnd) {
            let maxIdx = -1, count = 0, 
                // keeping track of sections and members allows us to resize div
                // and make sure that all users in the filter are rendered
                // without creating performance problems
                sectionsFound = 0, sectionsCount = 0,
                membersFound = 0,  membersCount = 0,
                currentId;
            const groupList = {};

            const membersList = this.channel.rows.filter((member, idx) => {
                // get rid of members not in role ID list
                if (member.type != "MEMBER"){
                    sectionsCount++;
                    return true;
                } 
                else membersCount++;

                let memberAllowed;
                if (useAnd) // AND 
                    memberAllowed = roles.every(role => member.roles.includes(role.id));
                else // OR
                    memberAllowed = member.roles.some(roleId => roles.some(role => role.id === roleId));

                // keep track of highest index we've reached
                if (memberAllowed) {
                    // only update "found" if a member is allowed, to make sure we don't overcount
                    sectionsFound += sectionsCount;
                    sectionsCount = 0;
                    membersFound += membersCount;
                    membersCount = 0;
                    maxIdx = idx;
                }

                return memberAllowed;
            }).filter((group, idx, arr) => {
                // construct list of groups that have members in them
                if (group.type != "GROUP") {
                    count = count + 1;

                    // last group ends in a member and won't be counted without the following lnie
                    if (!arr[idx + 1] && count > 0) groupList[currentId] = {count};

                    return true;
                }

                if (group.id != currentId) {
                    // found new group or are at end of list, add it to the list if there are members in it
                    if (count > 0) groupList[currentId] = {count};

                    currentId = group.id;
                    count = 0;
                }
                
                // filter out groups regardless
                return false;
            }).map(member => member.user.id); // return id, not member object

            if (this.channel.rows.length >= 100) {
                this.showLargeChannelWarning();
            }

            return {
                maxIdx,
                groupList,
                membersList,
                sectionsFound,
                membersFound
            }
        }

        showLargeChannelWarning() {
            if(this.showedWarning || !this.settings.showLargeChannelWarning) return;

            Toasts.warning("This channel is large (approx. 100+ members). It's possible that not every member you're searching for will be found.");
            this.showedWarning = true;
        }
        
        /**
         * Gets role from the current guild with matching id.
         * @param {string} roleId
         * @returns {Role} Role with matching id in current guild
         */
        getRoleById(roleId) {
            const guild = GuildStore.getGuild(this.getGuildId());
            const role = guild.roles[roleId];

            return new Role(
                role.id,
                role.name,
                role.colorString || "#b9bbbe"
            );
        }

        /**
         * Generates, caches, and returns list of guild roles
         * @returns {Role[]} List of roles
         */
        getAllRoles() {
            this.allRoles = this.allRoles || this.generateAllRoles();
            return this.allRoles;
        }

        /**
         * Maps roles in the current guild to a Role object
         * @returns {Role[]} List of roles
         */
        generateAllRoles() {
            const guildRoles = GuildStore.getGuild(this.getGuildId()).roles;

            const roles = [];

            for(const roleId in guildRoles) {
                const guildRole = guildRoles[roleId];
                
                if (guildRole.name === "@everyone") continue;
                
                roles.push(new Role(
                    guildRole.id,
                    guildRole.name,
                    guildRole.colorString || "#b9bbbe"
                ));
            }
            return roles;
        }

        /**
         * Toggle a role in the filter list.
         * @param {Role} role Role to toggle
         */
        toggleRole(role) {
            if (!this.filter) {
                this.setFilter([role]);
                this.updateMemberList();
            }
            else if (this.filter.roles.some(filterRole => filterRole.id === role.id)) {
                this.removeRoleFromFilter(role.id);
            }
            else {
                this.addRoleToFilter(role);
            }
        }

        /**
         * Adds a role to the filter and updates the member list.
         * Creates a new filter if not already filtering.
         * @param {Role} newRole Role to add to filter
         */
        addRoleToFilter(newRole) {
            if (this.filter) {
                if(!this.filter.roles.some(role => role.id === newRole.id)) {
                    this.filter.roles.push(newRole);
                }
                
                this.setFilter(this.filter.roles);
            }
            else {
                this.setFilter([newRole]);
            }
            
            this.updateMemberList();
        }

        /**
         * Removes the id from the filter, if it exists.
         * @param {string} roleId ID of the role to remove
         */
         removeRoleFromFilter(roleId) {
            if (!this.filter) return;
            this.filter.roles = this.filter.roles.filter(role => role.id != roleId);
            this.setFilter(this.filter.roles);
            this.updateMemberList();
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {Role[]} roles Array of roles included in the filter
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roles) {
            if (!Array.isArray(roles) || !roles.length) {
                this.filter = null;
            }
            else {
                const channelMembers = this.getAllowedMembers(roles, this.useAnd);
                this.filter = new Filter(
                    roles,
                    channelMembers.membersList,
                    channelMembers.groupList,
                    channelMembers.membersFound,
                    channelMembers.sectionsFound
                );
            }
        }

        /**
         * Creates a RoleHeader component and inserts it above the member list
         * @param {React.element} membersListElem React element to add RoleFilter elements
         */
        insertRoleElem(membersListElem) {    
            if (!Array.isArray(membersListElem.props.children))
            membersListElem.props.children = [membersListElem.props.children];

            const roleHeader = React.createElement(RoleHeader, {
                onAddButtonClick: (event) => this.handleAddButtonClick(event),
                onRoleClick: (roleId) => this.handleRoleFilterClick(roleId),
                filter: this.filter,
                showAddRoleButton: this.settings.showAddRoleButton
            });

            membersListElem.props.children.unshift(roleHeader);
            membersListElem.props.children.unshift();
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {MouseEvent} event The element to handle the click event on
         */
        handleRolePillClick(event) {
            let roleId = "";
            
            const target = event.target;

            if(target.classList.contains("roleFilter")) {
                return;
            } 
            else if (this.matchesClass(target, DiscordClassModules.PopoutRoles.role)) {
                roleId = this.getRoleId(target);
            }
            else if (this.matchesClass(target, DiscordClassModules.PopoutRoles.roleName) ||
                    this.matchesClass(target, DiscordClassModules.PopoutRoles.roleCircle)) {
                roleId = this.getRoleId(target.parentElement)
            }
            else {
                return;
            }

            if (event.stopPropogation) event.stopPropogation();

            // replace non-numerical characters in the id
            roleId = roleId.replace(/\D/g,"");

            this.toggleRole(this.getRoleById(roleId));
        }

        /**
         * Searches for a target classname in an html element
         * @param {HTML element} target The element to search
         * @param {string} classToMatch The className to search for
         * @returns {boolean} Whether classToMatch is found in target's classes
         */
        matchesClass(target, classToMatch) {
            return target.classList.contains(classToMatch) || target.className === classToMatch;
        }

        /**
         * Parses an element's attributes to retrieve the role id
         * @param {HTML element} elem Element representing a role id
         * @returns {string} The role id of the element
         */
        getRoleId(elem) {
            const roleId = elem.attributes["data-list-item-id"].value;
            return roleId && roleId.substr(roleId.indexOf("___", 3));
        }

        /**
         * Opens a role popout after closing the existing one.
         * @param {MouseEvent} event
         */
        handleAddButtonClick(event) {
            this.closePopout();
            
            this.openPopout(event.target);
            
            if (event.stopPropagation) event.stopPropagation();
        }

        /**
         * Opens a popout to add roles to the filter
         * @param {HTML Element} target 
         */
        openPopout(target) {
            // Return if in DM
            if ([
                1, // DM Channel type
                3  // Group DM Channel type
            ].includes(ChannelStore.getChannel(SelectedChannelStore.getChannelId()).type)) return;

            const popoutId = Popouts.openPopout(target, {
                position: "left",
                align: "top",
                spacing: 258,
                animation: Popouts.AnimationTypes.TRANSLATE,
                render: () => {
                    return React.createElement(RolePopout, {
                        onRoleSelect: (role) => this.addRoleToFilter(role),
                        onRoleDeselect: (role) => this.removeRoleFromFilter(role.id),
                        guildRoles: this.getAllRoles(),
                        selectedRoles: this.filter && this.filter.roles
                    });
                }
            });

            this.currentPopoutId = popoutId;
        }

        /**
         * Closes an open Role Filter popout, if one exists.
         */
        closePopout() {
            const openPopouts = document.querySelectorAll(`.${classes.popoutContainer}`);

            openPopouts.forEach(openPopout => openPopout.remove());
        }
        
        /**
         * Removes the specified role from the filter. Removes the filter if all filters are gone.
         * @param {string} roleId The ID of the role that was clicked on
         */
        handleRoleFilterClick(roleId) {
            if (!this.filter) return;
            this.removeRoleFromFilter(roleId);
            if (this.filter.roles.length === 0) this.resetFilter();
            this.updateMemberList();
        }
    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/