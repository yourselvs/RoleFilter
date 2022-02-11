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
    const { DiscordClassModules, DiscordModules, DiscordSelectors, Logger, Patcher, PluginUtilities, Popouts, ReactTools, Toasts, WebpackModules } = Library;

    const { GuildStore, React } = DiscordModules;

    const path = `M 256.00,0.00 C 114.60,0.00 0.00,114.60 0.00,256.00 0.00,397.40 114.60,512.00 256.00,512.00 397.40,512.00 512.00,397.40 512.00,256.00 512.00,114.60 397.40,0.00 256.00,0.00 Z M 377.30,316.50 C 385.70,324.90 385.70,338.50 377.30,346.90 377.30,346.90 346.90,377.30 346.90,377.30 338.50,385.70 324.90,385.70 316.50,377.30 316.50,377.30 255.70,316.50 255.70,316.50 255.70,316.50 194.90,377.30 194.90,377.30 186.50,385.70 172.90,385.70 164.50,377.30 164.50,377.30 134.00,346.90 134.00,346.90 125.60,338.50 125.60,324.90 134.00,316.50 134.00,316.50 194.80,255.70 194.80,255.70 194.80,255.70 134.00,194.80 134.00,194.80 125.60,186.40 125.60,172.80 134.00,164.40 134.00,164.40 164.40,134.00 164.40,134.00 172.80,125.60 186.40,125.60 194.80,134.00 194.80,134.00 255.60,194.80 255.60,194.80 255.60,194.80 316.40,134.00 316.40,134.00 324.80,125.60 338.40,125.60 346.80,134.00 346.80,134.00 377.20,164.40 377.20,164.40 385.60,172.80 385.60,186.40 377.20,194.80 377.20,194.80 316.40,255.60 316.40,255.60 316.40,255.60 377.30,316.50 377.30,316.50 Z`;
    const roleFilterCss = `.roleFilterWrap::-webkit-scrollbar { 
    display: none; 
} 

.roleFilter-addBtn { 
    fill: var(--interactive-normal)
} 

.roleFilter-addBtn:hover { 
    fill: var(--interactive-hover) 
}

.roleFilter-listContainer {
    width: 250px;
    overflow: hidden;
    border-radius: 4px;
    box-sizing: border-box;
    padding: 8px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-accent);
}`;

    const Lists = WebpackModules.getByProps("ListThin");

    const classes = {
        roleRoot: DiscordClassModules.PopoutRoles.root,
        role: `${DiscordClassModules.PopoutRoles.role} ${WebpackModules.getByProps("bodyInnerWrapper").bodyInnerWrapper} interactive roleFilter`,
        roleCircle: DiscordClassModules.PopoutRoles.roleCircle + " roleFilter",
        roleName: DiscordClassModules.PopoutRoles.roleName + " roleFilter",
        layer: DiscordClassModules.TooltipLayers.layer,
        listContainer: "roleFilter-listContainer"
    }

    const Role = class Role {
        constructor(id, name, color) {
            this.id = id;
            this.name = name;
            this.color = color;
        }
    }

    const Channel = class Channel {
        constructor(id, rows) {
            this.id = id;
            this.rows = rows;
        }
    }

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

    const AddRoleButton = class AddRoleButton extends React.Component {
        constructor(props) {
            super(props);
            this.onClick = this.onClick.bind(this);
        }
        
        onClick(e) {
            this.props.onClick(e);
        }

        render() {
            return React.createElement("svg", {
                className: "roleFilter-addBtn",
                style: {
                    width: "16px",
                    height: "20px"
                },
                onClick: this.onClick
            },
                React.createElement("path", {
                    d: path,
                    style: {
                        transformOrigin: "8px 0px",
                        transform: "scale(0.03125) rotate(45deg)"
                    }
                })
            )
        }
    }

    const RolePopout = class RolePopout extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return React.createElement("div", {
                className: `${classes.layer} ${classes.listContainer}`
            },
                "testing testing testing"
            );
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.handleRolePillClick = this.handleRolePillClick.bind(this);
            this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
            this.handleRoleFilterClick = this.handleRoleFilterClick.bind(this);

            this.getRolesById = this.getRolesById.bind(this);
            this.getRolesByName = this.getRolesByName.bind(this);

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

        getGuildId() {
            this.guildId = this.guildId || BdApi.findModuleByProps("getLastSelectedGuildId").getLastSelectedGuildId();

            return this.guildId;
        }

        /**
         * Prevent the scrollbar from rendering while the filter is active
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
                    Logger.info("Channel change detected.");
                    // if a channel object isn't created, or if the channel has changed, create new channel
                    this.channel = new Channel(
                        memberListContainer.props.channel.id,
                        memberListContainer.props.rows
                    );
                }

                // always insert the element, even when not filtering
                // so that user popout does not close when clicking filter
                if (value) this.insertRoleElem(value);

                this.initializeHeightValues();
                
                if (this.filter) this.applyFilterCss(value.ref.current);
                else if (this.elementToRevertCSS) this.revertFilterCss();

                return value;
            });
        }

        patchRoleMention() {
            
            const RoleMention = WebpackModules.getModule(m => m && m.default.displayName === "RoleMention");
            
            Patcher.after(RoleMention, "default", (_, [props], component) => {
                if (!component || !component.props || !component.props.className ||
                    !component.props.className.toLowerCase().includes("mention")) return;

                component.props.className += " interactive";
                component.props.onClick = (e) => this.filterByRoles(component.props.children[0].slice(1), this.getRolesByName);
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

        initializeHeightValues() {
            this.memberHeight = this.memberHeight || 44;
            this.sectionHeight = this.sectionHeight || 40;

            document.querySelector(DiscordSelectors.UserPopout.body.value)
        }

        findFirstInDOMChildren(element, regex, childFormat) {
            for (const child of element.children) {
                if (childFormat(child) && regex.test(childFormat(child))) {
                    return child;
                }
            }
            return null;
        }

        /**
         * Apply CSS to the elements which make up the members list.
         * Allows all members to render and still be scrollable.
         * @param {HTML element} element The members list HTML element
         */
        applyFilterCss(element) {
            const filterElementHeight = element.children[0].offsetHeight,
                totalMemberHeight = this.filter.membersFound * this.memberHeight,
                totalSectionHeight = this.filter.sectionsFound * this.sectionHeight,
                filteredMemberHeight = this.filter.membersAllowed.length * this.memberHeight,
                filteredSectionHeight = Object.keys(this.filter.sectionsAllowed).length * this.sectionHeight,
                // get the amount of padding there should be at the bottom of the list
                bottomPadding = element.computedStyleMap().get("padding-bottom").value;

            // set the list height so that all members are rendered
            element.style.height = filterElementHeight + totalSectionHeight + totalMemberHeight + "px";
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
            const guildRoles = GuildStore.getGuild(this.getGuildId()).roles;

            const roles = [];

            // roles is not an array >:( so we have to iterate through keys
            for (const roleId in guildRoles) {
                const guildRole = guildRoles[roleId];
                if(guildRole.name && roleName === guildRole.name) {
                    roles.push(new Role(
                        guildRole.id,
                        guildRole.name,
                        guildRole.colorString || "#b9bbbe"
                    ));
                }
            }

            return roles;
        }
        
        /**
         * Gets role from the current guild with matching id.
         * @param {string} roleId
         * @returns {Role} List of roles that match the passed name
         */
        getRolesById(roleId) {
            const guildId = this.getGuildId();
            const guild = GuildStore.getGuild(guildId);
            const role = guild.roles[roleId];

            return [new Role(
                role.id,
                role.name,
                role.colorString || "#b9bbbe"
            )];
        }
        
        /**
         * Filter channel member list on list of roles.
         * @param {Role[]} roles Array of roles to filter by
         */
        filterByRoles(roleVal, roleFunc) {
            const newRoles = roleFunc(roleVal);
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

            Logger.info(`Clicked on role: "${roleVal}". Members found:`, this.filter.membersAllowed);
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {Role[]} roles Array of roles included in the filter
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roles) {
            const channelMembers = this.getAllowedMembers(roles, this.useAnd);
            this.filter = {
                roles,
                membersAllowed: channelMembers.membersList,
                sectionsAllowed: channelMembers.groupList,
                membersFound: channelMembers.membersFound,
                sectionsFound: channelMembers.sectionsFound
            }
        }

        /**
         * Creates the RoleFilter elements and inserts them above the member list
         * @param {React.element} membersListElem React element to add RoleFilter elements
         */
        insertRoleElem(membersListElem) {    
            if (!Array.isArray(membersListElem.props.children))
            membersListElem.props.children = [membersListElem.props.children];

            const roleContainer = this.createRoleFilterElements();

            membersListElem.props.children.unshift(roleContainer);
            membersListElem.props.children.unshift();
        }

        /**
         * Creates a Role pill and prepends it to children of passed in element. 
         * @returns {React.element} React element that contains role filter elements
         */
         createRoleFilterElements() {
            const roleStyle = { padding: "22px 8px 0px 16px" };

            const roleFiltersList = this.getRoleFilterListElem();

            const children = [this.getRoleAddButtonElem(roleFiltersList ? 6 : 0)];


            if(roleFiltersList) {
                children.push(roleFiltersList);
            }

            return React.createElement("div", {
                className: classes.roleRoot,
                style: roleStyle,
                children: children
            });
        }

        getRoleAddButtonElem(padding) {
            return React.createElement("div", {
                style: { 
                    width: "100%",
                    paddingBottom: `${padding}px`
                }
            }, 
                React.createElement(AddRoleButton, {
                    onClick: this.handleAddButtonClick
                })
            );
        }

        getRoleFilterListElem() {
            const roleFiltersListChildren = this.getRoleFilterListChildren();

            // if there are no children, return null
            return roleFiltersListChildren && React.createElement("div", {
                style: { display: "contents" },
                children: roleFiltersListChildren
            });
        }

        getRoleFilterListChildren() {
            return this.filter && this.filter.roles.map(role =>
                React.createElement(RolePill, {
                    role,
                    onClick: this.handleRoleFilterClick
                })
            );
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {HTML element} target The element to handle the click event on
         */
        handleRolePillClick(e) {
            let roleId = "";
            
            const target = e.target;

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

            this.filterByRoles(roleId, this.getRolesById);
        }

        matchesClass(target, className) {
            return target.classList.contains(className) || target.className === className;
        }

        getRoleId(elem) {
            const roleId = elem.attributes["data-list-item-id"].value;
            return roleId.substr(roleId.indexOf("___", 3));
        }

        handleAddButtonClick(e) {
            const openPopouts = document.querySelectorAll(`.${classes.listContainer}`);

            openPopouts.forEach(openPopout => openPopout.remove());
            
            Popouts.openPopout(e.target, {
                position: "left",
                align: "top",
                spacing: 258,
                animation: Popouts.AnimationTypes.TRANSLATE,
                render: (p) => {
                    return React.createElement(RolePopout, p);
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