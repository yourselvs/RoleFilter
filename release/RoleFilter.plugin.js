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
    const {DiscordClasses, DiscordModules, DiscordSelectors, DOMTools, Logger, Patcher, ReactTools, Toasts, Utilities, WebpackModules} = Library;

    const GuildStore = DiscordModules.GuildStore;
    const GuildMemberStore = DiscordModules.GuildMemberStore;

    const Lists = WebpackModules.getByProps('ListThin');
    const Guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.guildId = "";
            this.roleName = null;
            this.roleStyle = "";
            this.usersAllowed = null;
            this.linkRole = this.linkRole.bind(this);
        }
        
        onStart() {
            this.patchRoles();
            this.patchGuilds();
            this.patchMemberList();

            document.addEventListener("click", this.linkRole, true);
            
            Toasts.info(`${this.name} ${this.version} has started!`);
        }

        onStop() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(roleModule.role.includes(" interactive")) {
                roleModule.role = roleModule.role.replace(" interactive","");
            }

            document.removeEventListener.bind(document, "click", this.linkRole, true);
            
            Patcher.unpatchAll();

            this.updateMemberList();

            Toasts.info(`${this.name} ${this.version} has stopped!`);
        }

        resetFilter() {
            this.guildId = "";
            this.usersAllowed = null;
            this.updateMemberList();
        }

        async patchGuilds() {
            const GuildsList = await new Promise((resolve) => {
                const guildsWrapper = document.querySelector(`.${Guilds.wrapper.replace(/\s/, '.')}`);
                if (!guildsWrapper) return resolve(null);
                const instance = ReactTools.getReactInstance(guildsWrapper);
                const forwarded = Utilities.findInTree(instance, (tree) => {
                    if (!tree) return false;
                    const forward = String(tree['$$typeof']).includes('react.forward_ref');
                    const string = tree.render?.toString().includes('ltr');
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
                    this.resetFilter();
                }

                return value;
            });
        }

        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                if (!this.usersAllowed || !Array.isArray(this.usersAllowed) || !this.usersAllowed.length) return value;
                if (!props || !props['data-list-id'] || !props['data-list-id'].startsWith('members')) return value;
                
                const rootClass = DiscordClasses.PopoutRoles.root.value,
                    roleClass = DiscordClasses.PopoutRoles.role.value + " bodyInnerWrapper-26fQXj roleFilter",
                    roleCircleClass = DiscordClasses.PopoutRoles.roleCircle.value + " roleFilter",
                    roleNameClass = DiscordClasses.PopoutRoles.roleName.value + " roleFilter";

                const membersChild = value.props.children;

                // yeah i know this is ugly
                const newReactElem = ReactTools.createWrappedElement(DOMTools.createElement(
                `<div class="${rootClass}" style="padding: 24px 8px 0 16px">` +
                    `<div class="${roleClass}">` +
                        `<div class="${roleCircleClass}" style="${this.roleStyle}"></div>` +
                        `<div class="${roleNameClass}">` +
                            `${this.roleName}` +
                        "</div>" +
                    "</div>" + 
                "</div>"));

                value.props.children = [
                    newReactElem,
                    membersChild
                ];

                const classesRef = DiscordClasses;
                
                const target = Array.isArray(value)
                    ? value.find((i) => i && !i.key)
                    : value;
                const childProps = this.getProps(target.props.children[1], 'props.children.props');
                if (!childProps) return value;
                const children = this.getProps(childProps, 'children');
                if (!children || !Array.isArray(children)) return value;
                if (!this.usersAllowed || !Array.isArray(this.usersAllowed) || !this.usersAllowed.length) return value;
                
                childProps.children = children.filter((user) => {
                    if (!user.key || !user.key.startsWith('member')) return true;
                    const { 1: id } = user.key.split('-');
                    return this.usersAllowed.map(user => user.userId).includes(id);
                }).map((entry, i, arr) => {
                    // hide groups with no users under them
                    if (!entry) return null;
                    const { key } = entry;
                    const next = arr[i + 1];
                    const sect = (item) => item && item.key.startsWith('section-');
                    const bool = sect(next);
                    if (key.startsWith('section-') && bool) return null;
                    return entry;
                });

                return value;
            });

            this.updateMemberList();
        }

        updateMemberList() {
            const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
            if (!memberList) return;
            const owner = ReactTools.getOwnerInstance(memberList);
            owner.forceUpdate();
            if (owner.handleScroll) owner.handleScroll();
        }

        patchRoles() {
            const roleModule = WebpackModules.getByProps("role")
            
            if(!roleModule.role.includes("interactive")) {
                roleModule.role += " interactive"
            }
            
            const RoleObj = WebpackModules.getModule(m => m?.default.displayName === 'UserPopoutBody');
            Patcher.after(RoleObj, "default",  (_, [props], component) => {
                if (!component || !component.props || !component.props.className) return;

                this.guildId = props.guild.id;
            });
        }

        linkRole({ target }) {
            let roleName = "";
            let roleStyle = "";

            if(!this.guildId) {
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

            if (target.classList.contains("roleFilter")) {
                this.resetFilter();
            }
            
            const rolesObj = GuildStore.getGuild(this.guildId).roles;

            const roleIds = [];

            for (const roleId in rolesObj) {
                const role = rolesObj[roleId];
                if(role.name && role.name === roleName) {
                    roleIds.push(roleId);
                }
            }
            
            const members = GuildMemberStore.getMembers(this.guildId)
                .filter(member => 
                    member.roles.some(roleId => 
                        roleIds.includes(roleId)
                    )
                );

            this.roleName = roleName;
            this.roleStyle = "background-color:" + roleStyle
            
            Toasts.success(`Clicked on role: "${roleName}". Members found: ${members.length}`);
            Logger.info("Clicked on role:", roleName , ". Role ids found:", roleIds, ". Members found:", members);

            if(roleIds.length > 1) {
                Toasts.info(`Found ${roleIds.length} overlapping roles with the same name. All roles are included in the filtered member list.`);
            }

            this.usersAllowed = members;

            this.updateMemberList();
        }

        /**
         * @name safelyGetNestedProps
         * @author Zerebos
         */
        getProps(obj, path) {
            return path.split(/\s?\.\s?/).reduce((object, prop) => object && object[prop], obj);
        }
    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/