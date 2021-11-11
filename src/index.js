module.exports = (Plugin, Library) => {
    const {DiscordModules, DiscordSelectors, Logger, Patcher, ReactTools, Toasts, Utilities, WebpackModules} = Library;

    const GuildStore = DiscordModules.GuildStore;
    const GuildMemberStore = DiscordModules.GuildMemberStore;

    const Lists = WebpackModules.getByProps('ListThin');
    const Guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');

    return class RoleFilter extends Plugin {
        constructor() {
            super();

            this.guildId = "";
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
                    this.guildId = "";
                    this.usersAllowed = "";
                    this.updateMemberList();
                }

                return value;
            });
        }

        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                if (!this.usersAllowed || !Array.isArray(this.usersAllowed) || !this.usersAllowed.length) return value;
                if (!props || !props['data-list-id'] || !props['data-list-id'].startsWith('members')) return value;

                if (props.guildId) {
                    Logger.log("guildId found: ", guildId);
                    
                    if (props.guildId != this.guildId) {
                        this.guildId = "";
                        this.usersAllowed = null;

                        this.updateMemberList();
                    }
                }

                const target = Array.isArray(value)
                    ? value.find((i) => i && !i.key)
                    : value;
                const childProps = this.getProps(target, 'props.children.props.children.props');
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

            if(!this.guildId) {
                return;
            } 
            else if (target.classList.contains("role-2irmRk")) {
                roleName = target.children[1].innerText;
            }
            else if (target.classList.contains("roleName-32vpEy")) {
                roleName = target.innerText;
            }
            else if (target.classList.contains("roleCircle-3xAZ1j")) {
                roleName = target.nextSibling.innerText;
            }
            else {
                return;
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