/**
 * @name RoleFilter
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/yourselvs/RoleFilter
 * @source https://github.com/yourselvs/RoleFilter/blob/main/release/RoleFilter.plugin.js
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
    const config = {"info":{"name":"Role Filter","authors":[{"name":"yourselvs","discord_id":"110574243023966208","github_username":"yourselvs","twitter_username":""}],"version":"0.0.1","description":"Filter the user list by selected roles.","github":"https://github.com/yourselvs/RoleFilter","github_raw":"https://github.com/yourselvs/RoleFilter/blob/main/release/RoleFilter.plugin.js"},"changelog":[{"title":"Building the plugin","type":"progress","items":["Creating user list filter","Developing filter interactions"]}],"main":"index.js"};

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
    const { DiscordClasses, DiscordModules, DiscordSelectors, Logger, Patcher, ReactTools, Utilities, WebpackModules } = Library;

    const { GuildStore, React } = DiscordModules;

    const Lists = WebpackModules.getByProps('ListThin');
    const Guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');

    const rootClass = DiscordClasses.PopoutRoles.root.value,
        roleClass = DiscordClasses.PopoutRoles.role.value + " bodyInnerWrapper-26fQXj interactive roleFilter",
        roleCircleClass = DiscordClasses.PopoutRoles.roleCircle.value + " roleFilter",
        roleNameClass = DiscordClasses.PopoutRoles.roleName.value + " roleFilter";

    const Role = class Role extends React.Component {
        constructor(props) {
            super(props);
            this.onClick = this.onClick.bind(this);
        }
        
        onClick() {
            this.props.onClick();
        }

        render() {
            return React.createElement('div', {
                className: rootClass,
                style: {padding: "24px 8px 0px 16px"}
            },
                React.createElement('div', {
                    className: roleClass,
                    style: {overflow: "auto"},
                    onClick: this.onClick
                },
                    React.createElement('div', {
                        className: roleCircleClass,
                        style: {
                            backgroundColor: this.props.color,
                            // ensure circle has proper width on long role names
                            display: "inline-table"
                        }
                    }),
                    React.createElement('div', {className: roleNameClass},
                        this.props.name
                    )
                )
            )
        }
    }

    const Channel = class Channel {
        constructor(id, rows) {
            this.id = id;
            this.rows = rows;
        }

        /**
         * Get a list of role IDs that match a list of role names
         * @param {string[]} roleNames List of names to search for
         * @returns {string[]} List of role IDs that were found
         */
        getRoleIds(roleNames, guildId) {
            const roles = GuildStore.getGuild(guildId).roles;

            const roleIds = [];

            // roles is not an array >:( so we have to iterate through keys
            for (const roleId in roles) {
                const role = roles[roleId];
                if(role.name && roleNames.includes(role.name)) {
                    roleIds.push(roleId);
                }
            }

            return roleIds;
        }

        /**
         * Takes a role name, finds all IDs with that role, and calls getMembersByRoleIds.
         * @param {string[]} roleNames The name of the role to find
         * @param {string} guildId The ID of the guild to search for roles
         * @returns {
         *     maxIdx: number,
         *     groupList: {groupId: count of group},
         *     membersList: string[] ,
         *     sectionsFound: number,
         *     membersFound: number 
         * }
         */
        getMembersByRoleNames(roleNames, guildId) {
            const roleIds = this.getRoleIds(roleNames, guildId);

            return this.getMembersByRoleIds(roleIds);
        }

        /**
         * Take a list of role IDs and return information on how to filter by those IDs.
         * @param {number[]} roleIds List of IDs to include in the filter
         * @returns {
         *     maxIdx: number,
         *     groupList: {groupId: count of group},
         *     membersList: string[] ,
         *     sectionsFound: number,
         *     membersFound: number 
         * }
         */
        getMembersByRoleIds(roleIds) {
            let maxIdx = -1, count = 0, 
                // keeping track of sections and members allows us to resize div
                // and make sure that all users in the filter are rendered
                // without creating performance problems
                sectionsFound = 0, sectionsCount = 0,
                membersFound = 0,  membersCount = 0,
                currentId;
            const groupList = {};
            const membersList = this.rows.filter((member, idx) => {
                // get rid of members not in role ID list
                if (member.type != "MEMBER"){
                    sectionsCount++;
                    return true;
                } 
                else membersCount++;
                
                const memberAllowed = member.roles.some(roleId => roleIds.includes(roleId));
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

            return {
                maxIdx,
                groupList,
                membersList,
                sectionsFound,
                membersFound
            }
        }
    }

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.handleRoleClick = this.handleRoleClick.bind(this);
            this.resetFilter = this.resetFilter.bind(this);
        }
        
        onStart() {
            this.patchRoles();
            this.patchGuilds();
            this.patchMemberList();

            document.addEventListener("click", this.handleRoleClick, true);
        }

        onStop() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(roleModule.role.includes(" interactive")) {
                roleModule.role = roleModule.role.replace(" interactive","");
            }

            document.removeEventListener.bind(document, "click", this.handleRoleClick, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();
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
         * Make roles interactive, and set the guild id when viewing user's roles
         */
        patchRoles() {
            const roleModule = WebpackModules.getByProps("role")

            if(!roleModule.role.includes("interactive")) {
                roleModule.role += " interactive"
            }
            
            const RoleObj = WebpackModules.getModule(m => m && m.default.displayName === 'UserPopoutBody');
            Patcher.after(RoleObj, "default",  (_, [props], component) => {
                if (!component || !component.props || !component.props.className) return;

                this.guildId = props.guild.id;
            });
        }

        /**
         * Watches for changes in the guild ID. 
         */
        async patchGuilds() {
            const GuildsList = await new Promise((resolve) => {
                const guildsWrapper = document.querySelector(`.${Guilds.wrapper.replace(/\s/, '.')}`);
                if (!guildsWrapper) return resolve(null);
                const instance = ReactTools.getReactInstance(guildsWrapper);
                const forwarded = Utilities.findInTree(instance, (tree) => {
                    if (!tree) return false;
                    const forward = String(tree['$$typeof']).includes('react.forward_ref');
                    const string = tree.render && tree.render.toString().includes('ltr');
                    return forward && string;
                }, {
                    walkable: [
                        'type',
                        'child',
                        'sibling'
                    ]
                });
                if (instance && forwarded) resolve(forwarded);
                else resolve(null);
            });

            if (!GuildsList) return;
            
            Patcher.after(GuildsList, 'render', (that, props, value) => {
                if (this.guildId != BdApi.findModuleByProps('getLastSelectedGuildId').getLastSelectedGuildId()) {
                    Logger.info("Server change detected.");
                    this.resetFilter();
                }

                return value;
            });
        }

        /**
         * Renders the role pill when filtering. Watches for channel changes.
         */
        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                
                if (!props || !props['data-list-id'] 
                    || !props['data-list-id'].startsWith('members')
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

                    // if a filter has been applied, refresh the filter for new channel
                    if (this.filter) {
                        const roleIds = this.channel.getRoleIds(this.filter.roleNames, this.guildId);

                        this.filterByIds(roleIds, this.filter.roleNames, this.filter.roleStyles);
                        this.updateMemberList();
                    }
                }

                if (this.filter && value) this.insertRoleElem(value);                

                return value;
            });
        }

        /**
         * Alters the render functions in the member list container to follow filter behavior.
         * @param {React element} memberListElem the member list element
         */
        patchMemberListContainer(memberListElem) {
            const memberList = ReactTools.getOwnerInstance(memberListElem.ref.current.parentElement);
            
            Patcher.after(memberList, "renderRow", (that, args, value) => {
                if (!this.filter || !this.filter.membersAllowed || !value || !value.props) return value;
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
         * Filter on list of roles by their unique IDs.
         * @param {string[]} roleIds The IDs of the roles
         * @param {string[]} roleNames The names of the roles
         * @param {string[]} roleStyles The values to set the css background-color of the role
         */
        filterByIds(roleIds, roleNames, roleStyles) {
            this.setFilter(roleNames, roleStyles, this.channel.getMembersByRoleIds(roleIds));
        }

        /**
         * Filter on all roles with matching name.
         * @param {string[]} roleNames The name of the role
         * @param {string[]} roleStyles The values to set the css background-color of the role
         */
        filterByName(roleNames, roleStyles) {
            this.setFilter(roleNames, roleStyles, this.channel.getMembersByRoleNames(roleNames, this.guildId));
        }

        /**
         * Sets the filter object. Does not refresh list or apply the filter.
         * @param {string[]} roleNames The names of the roles
         * @param {string[]} roleStyles The values to set the css background-color of the role
         * @param {*} channelMembers Object which contains information on the filter
         */
        setFilter(roleNames, roleStyles, channelMembers) {
            this.filter = {
                roleNames: roleNames,
                roleStyles: roleStyles,
                membersAllowed: channelMembers.membersList,
                sectionsAllowed: channelMembers.groupList
            }
        }

        /**
         * Creates a Role pill and prepends it to children of passed in element.
         * @param {React.element} membersListElem React element to add role to
         */
        insertRoleElem(membersListElem) {            
            if (!Array.isArray(membersListElem.props.children))
                membersListElem.props.children = [membersListElem.props.children];

            this.filter.roleNames.forEach((name, idx) => {
                membersListElem.props.children.unshift(React.createElement(Role, {
                    color: this.filter.roleStyles[idx],
                    name: name,
                    onClick: this.resetFilter
                }));
            })
        }

        /**
         * Handles all click events. 
         * Filters out event if target's classes don't match role classes.
         * @param {HTML Element} target The element to handle the click event on
         */
        handleRoleClick({ target }) {
            let roleName = "";
            let roleStyle = "";

            if(!this.guildId || target.classList.contains("roleFilter")) {
                return;
            } 
            else if (target.classList.contains("role-2irmRk")) {
                roleName = target.children[1].innerText;
                roleStyle = target.children[0].style.backgroundColor;
            }
            else if (target.classList.contains("roleName-32vpEy")) {
                roleName = target.innerText;
                roleStyle = target.previousElementSibling.style.backgroundColor;
            }
            else if (target.classList.contains("roleCircle-3xAZ1j")) {
                roleName = target.nextSibling.innerText;
                roleStyle = target.style.backgroundColor
            }
            else {
                return;
            }

            this.filterByName([roleName], [roleStyle]);
            
            Logger.info(`Clicked on role: "${roleName}". Members found:`, this.filter.membersAllowed);

            this.updateMemberList();
        }
    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/