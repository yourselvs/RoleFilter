/**
 * @name RoleFilter
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/yourselvs/RoleFilter
 * @source https://raw.githubusercontent.com/yourselvs/RoleFilter/main/release/RoleFilter.plugin.js
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
    const config = {"info":{"name":"Role Filter","authors":[{"name":"yourselvs","discord_id":"110574243023966208","github_username":"yourselvs","twitter_username":""}],"version":"1.1.0","description":"Filter the user list by selected roles.","github":"https://github.com/yourselvs/RoleFilter","github_raw":"https://raw.githubusercontent.com/yourselvs/RoleFilter/main/release/RoleFilter.plugin.js"},"changelog":[{"title":"Compatibility update","items":["The plugin works again after the new discord update. Future updates should not break it as significantly."]},{"title":"Compatible with roles with duplicate names","type":"fixed","items":["Filtering on a role no longer pulls in roles with duplicate names."]}],"main":"index.js"};

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
    const { DiscordClasses, DiscordClassModules, DiscordModules, DiscordSelectors, Logger, Patcher, PluginUtilities, Popouts, ReactTools, Toasts, Tooltip, WebpackModules } = Library;

    const { GuildStore, React } = DiscordModules;

    const path = `M 256.00,0.00 C 114.60,0.00 0.00,114.60 0.00,256.00 0.00,397.40 114.60,512.00 256.00,512.00 397.40,512.00 512.00,397.40 512.00,256.00 512.00,114.60 397.40,0.00 256.00,0.00 Z M 377.30,316.50 C 385.70,324.90 385.70,338.50 377.30,346.90 377.30,346.90 346.90,377.30 346.90,377.30 338.50,385.70 324.90,385.70 316.50,377.30 316.50,377.30 255.70,316.50 255.70,316.50 255.70,316.50 194.90,377.30 194.90,377.30 186.50,385.70 172.90,385.70 164.50,377.30 164.50,377.30 134.00,346.90 134.00,346.90 125.60,338.50 125.60,324.90 134.00,316.50 134.00,316.50 194.80,255.70 194.80,255.70 194.80,255.70 134.00,194.80 134.00,194.80 125.60,186.40 125.60,172.80 134.00,164.40 134.00,164.40 164.40,134.00 164.40,134.00 172.80,125.60 186.40,125.60 194.80,134.00 194.80,134.00 255.60,194.80 255.60,194.80 255.60,194.80 316.40,134.00 316.40,134.00 324.80,125.60 338.40,125.60 346.80,134.00 346.80,134.00 377.20,164.40 377.20,164.40 385.60,172.80 385.60,186.40 377.20,194.80 377.20,194.80 316.40,255.60 316.40,255.60 316.40,255.60 377.30,316.50 377.30,316.50 Z`;
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

/* Hide  */
.roleFilter-popoutContainer::-webkit-scrollbar { 
    display: none; 
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
}

.roleFilter-searchInput {
    font-size: 16px;
    height: 34px;
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
}

.roleFilter-listOption:last-of-type {
    margin-bottom: 0;
}

.roleFilter-listOption.selected {
    background: var(--background-secondary-alt);
}

.roleFilter-btnContainer {
    width: 100%;
}

.roleFilter-btnPadding {
    padding-bottom: 6px;
}

.roleFilter-role {
    margin: 4px 4px 0px 0px;
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
        searchContainer: "roleFilter-searchContainer",
        searchInput: "roleFilter-searchInput",
        btnContainer: "roleFilter-btnContainer",
        btnPadding: "roleFilter-btnPadding",
        addBtn: "roleFilter-addBtn",
        addBtnPath: "roleFilter-addBtnPath"
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
            this.onClick = this.onClick.bind(this);
        }
        
        onClick() {
            this.props.onClick(this.props.role.id);
        }

        render() {
            return React.createElement("div", {
                className: classes.role,
                style: {overflow: "auto"},
                onClick: this.onClick
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
            this.onClick = this.onClick.bind(this);
        }
        
        onClick(e) {
            this.props.onClick(e);
        }

        render() {
            let btnContainerClass = `${classes.btnContainer} ${this.props.usePadding && classes.btnPadding}`;
            
            return React.createElement("div", {
                className: btnContainerClass
            }, 
                React.createElement("svg", {
                    className: classes.addBtn,
                    onClick: this.onClick
                },
                    React.createElement("path", {
                        className: classes.addBtnPath,
                        d: path
                    })
                )
            );
        }
    }

    /**
     * @property {() => void} onAddButtonClick Called when the "add role" button is clicked
     * @property {() => void} onRoleClick Called when a role pill in the filter list is clicked
     * @property {Filter} filter The plugin's current filter state
     */
    const RoleHeader = class RoleHeader extends React.Component {
        render() {
            const containerClass = `${classes.roleRoot} ${classes.header}`;

            return React.createElement("div", {
                className: containerClass
            },
                React.createElement(AddRoleButton, {
                    onClick: this.props.onAddButtonClick,
                    usePadding: !!this.props.filter
                }),
                React.createElement(RoleFilterList, {
                    filter: this.props.filter,
                    onClick: this.props.onRoleClick
                })
            );
        }        
    }

    /**
     * @property {() => void} onRoleClick Called when a role in the popout list is clicked
     * @property {Role[]} guildRoles List of roles in the currently selected guild
     * @property {Role[]} selectedRoles List of roles applied by the filter
     */
    const RolePopout = class RolePopout extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                searchValue: null
            };

            this.onSearch = this.onSearch.bind(this);
        }

        render() {
            return React.createElement("div", {
                className: `${classes.layer} ${classes.popoutContainer}`
            },
                React.createElement(RoleSearch, {
                    onChange: this.onSearch
                }),
                React.createElement(RoleList, {
                    onRoleClick: this.props.onRoleClick,
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
     * @property {() => void} onChange Called when the input value is changed
     */
    const RoleSearch = class RoleSearch extends React.Component {
        render() {
            return React.createElement("div", {
                className: classes.searchContainer
            },
                React.createElement("input", {
                    className: classes.searchInput,
                    placeholder: "Search Roles...",
                    onChange: this.props.onChange,
                    autoFocus: true,
                    onFocus: e => e.target.select()
                })
            );
        }
    }

    /**
     * @property {() => void} onRoleClick Called when a role in the popout list is clicked
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

            this.onRoleClick = this.onRoleClick.bind(this);
        }

        render() {
            return React.createElement("div", {
                className: classes.listContainer,
                children: this.getRoleList()
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
                    onClick: this.onRoleClick,
                    role,
                    selected
                })
            });
        }

        /**
         * Adds role to the selectedRoles state.
         * Fires callback to add role to plugin state.
         * @param {Role} role Role object to add to state and filter
         */
        onRoleClick(role) {
            let roles = this.state.selectedRoles;

            if(!roles)
                roles = [];

            roles.push(role);

            this.setState({
                selectedRoles: roles
            });

            this.props.onRoleClick(role);
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
    }

    /**
     * @property {Role} role The role to construct the list option from
     * @property {boolean} selected Whether or not the list option is selected in the filter
     */
    const RoleListOption = class RoleListOption extends React.Component {
        constructor(props) {
            super(props);
            
            this.onClick = this.onClick.bind(this);
        }

        render() {
            return React.createElement("div", {
                className: `${classes.listOption} ${this.props.selected ? 'selected': 'interactive'}`,
                style: {
                    color: this.props.role.color
                },
                onClick: this.onClick
            }, this.props.role.name);
        }

        onClick() {
            this.props.onClick(this.props.role);
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.handleRolePillClick = this.handleRolePillClick.bind(this);
            this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
            this.handleRoleFilterClick = this.handleRoleFilterClick.bind(this);

            this.getRoleById = this.getRoleById.bind(this);
            this.getRolesByName = this.getRolesByName.bind(this);
            this.addRoleToFilter = this.addRoleToFilter.bind(this);

            this.useAnd = true;
        }
        
        onStart() {
            this.initializeCss();
            this.patchRoles();
            this.patchMemberList();
            this.patchRoleMention();

            document.addEventListener("click", this.handleRolePillClick, true);
        }

        onStop() {

            document.removeEventListener.bind(document, "click", this.handleRolePillClick, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();
            
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
         * Make roles interactive
         */
        patchRoles() {
            const roleClass = DiscordClassModules.PopoutRoles["role"];

            if(!roleClass.includes("interactive")) {
                DiscordClassModules.PopoutRoles["role"] += " interactive";
            }
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
                if (!component || !component.props || !component.props.className ||
                    !component.props.className.toLowerCase().includes("mention")) return;

                const roles = this.getRolesByName(component.props.children[0].slice(1));

                component.props.className += " interactive";
                component.props.onClick = (e) => this.addRolesToFilter(roles);
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
                Toasts.warning("This channel is large (approx. 100+ members). It's possible that not every member you're searching for will be found.");
            }

            return {
                maxIdx,
                groupList,
                membersList,
                sectionsFound,
                membersFound
            }
        }

        /**
         * Gets all roles in the current guild whose name matches the passed in parameter.
         * @param {string} roleName 
         * @returns {Role[]} List of roles that match the passed name
         */
        getRolesByName(roleName) {
            const guildRoles = this.getAllRoles();

            const roles = [];

            // roles is not an array >:( so we have to iterate through keys
            for (const role in guildRoles) {
                if(role.name && roleName === role.name) {
                    roles.push(role);
                }
            }

            return roles;
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
                roles.push(new Role(
                    guildRole.id,
                    guildRole.name,
                    guildRole.colorString || "#b9bbbe"
                ));
            }
            return roles;
        }

        /**
         * Wraps a single role in an array and passes it off to new function
         * @param {Role} newRole Role to add to filter
         */
        addRoleToFilter(newRole) {
            this.addRolesToFilter([newRole]);
        }

        /**
         * Adds a list of roles to the filter and updates the member list.
         * Creates a new filter if not already filtering.
         * @param {Role[]} newRoles List of roles to add
         */
        addRolesToFilter(newRoles) {
            if (this.filter) {
                this.filter.roles = this.filter.roles.concat(
                    // Don't add the role to the filter if it's already in there
                    newRoles.filter(newRole => !this.filter.roles.some(role => role.id === newRole.id))
                );
                this.setFilter(this.filter.roles);
            }

            else
                this.setFilter(newRoles);

            this.updateMemberList();
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {Role[]} roles Array of roles included in the filter
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roles) {
            const channelMembers = this.getAllowedMembers(roles, this.useAnd);
            this.filter = new Filter(
                roles,
                channelMembers.membersList,
                channelMembers.groupList,
                channelMembers.membersFound,
                channelMembers.sectionsFound
            );
        }

        /**
         * Creates a RoleHeader component and inserts it above the member list
         * @param {React.element} membersListElem React element to add RoleFilter elements
         */
        insertRoleElem(membersListElem) {    
            if (!Array.isArray(membersListElem.props.children))
            membersListElem.props.children = [membersListElem.props.children];

            const roleHeader = React.createElement(RoleHeader, {
                onAddButtonClick: this.handleAddButtonClick,
                onRoleClick: this.handleRoleFilterClick,
                filter: this.filter
            });

            membersListElem.props.children.unshift(roleHeader);
            membersListElem.props.children.unshift();
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {HTML element} target The element to handle the click event on
         */
        handleRolePillClick(e) {
            let roleId = "";
            
            const target = e.target;

            const scrollers = DiscordClasses.Scrollers.scrollerWrap;
            const scrollerMod = DiscordSelectors.Scrollers.scroller;
            const selecto = DiscordSelectors.Scrollers.scrollerThemed;
            const selecto2 = DiscordSelectors.Scrollers.themeGhostHairline;

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

            if (e.stopPropogation) e.stopPropogation();

            // replace non-numerical characters in the id
            roleId = roleId.replace(/\D/g,"");

            this.addRoleToFilter(this.getRoleById(roleId));
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
         * Opens a popout to add roles to the filter
         * @param {MouseEvent} e
         */
        handleAddButtonClick(e) {
            const openPopouts = document.querySelectorAll(`.${classes.popoutContainer}`);

            openPopouts.forEach(openPopout => openPopout.remove());
            
            Popouts.openPopout(e.target, {
                position: "left",
                align: "top",
                spacing: 258,
                animation: Popouts.AnimationTypes.TRANSLATE,
                render: () => {
                    return React.createElement(RolePopout, {
                        onRoleClick: this.addRoleToFilter,
                        guildRoles: this.getAllRoles(),
                        selectedRoles: this.filter && this.filter.roles
                    });
                }
            });
            
            if (e.stopPropagation) e.stopPropagation();
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