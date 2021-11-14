module.exports = (Plugin, Library) => {
    const {DiscordClasses, DiscordModules, DiscordSelectors, DOMTools, Logger, Patcher, Popouts, ReactTools, Toasts, Utilities, WebpackModules} = Library;

    const {GuildStore, GuildMemberStore, ImageResolver, React, UserStore } = DiscordModules;

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
                        style: {backgroundColor: this.props.color}
                    }),
                    React.createElement('div', {className: roleNameClass},
                        this.props.name
                    )
                )
            )
        }
    }

    const Channel = class Channel {
        constructor(channelId, guildId, rows) {
            this.channelId = channelId;
            this.guildId = guildId;
            this.rows = rows;
        }

        getMemberRows() {
            return rows.filter(row => row.type ===  "MEMBER");
        }

        getRoleIds(roleName) {
            const roles = GuildStore.getGuild(this.guildId).roles;

            const roleIds = [];

            for (const roleId in roles) {
                const role = roles[roleId];
                if(role.name && role.name === roleName) {
                    roleIds.push(roleId);
                }
            }

            return roleIds;
        }

        getMembersByRoleName(roleName) {
            const roleIds = this.getRoleIds(roleName);

            return this.getMembersByRoleIds(roleIds);
        }

        getMembersByRoleIds(roleIds) {
            let maxIdx = -1, count = 0, currentId;
            const groupList = {};
            const filteredMembersList = this.rows.filter((member, idx) => {
                // get rid of members not in role ID list
                if (member.type != "MEMBER") return true;
                
                const memberAllowed = member.roles.some(roleId => roleIds.includes(roleId));
                // keep track of highest index we've reached
                if (memberAllowed) maxIdx = Math.max(maxIdx, idx);

                return memberAllowed;
            })
            
            const filteredGroupList = filteredMembersList.filter((group, idx, arr) => {
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
            })
            
            const membersList = filteredGroupList.map(member => member.user.id); // return id, not member object

            return {
                maxIdx,
                groupList,
                membersList
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

        resetFilter() {
            this.guildId = "";
            this.filter = null;
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

        patchMemberList() {
            Patcher.after(Lists.ListThin, 'render', (that, args, value) => {
                const [props] = args;
                
                if (!props || !props['data-list-id'] 
                    || !props['data-list-id'].startsWith('members')
                    || !value.ref || !value.ref.current) return value;

                const memberListContainer = ReactTools.getOwnerInstance(value.ref.current.parentElement)

                this.patchMemberListContainer(value);

                if (!this.channel || this.channel.id != memberListContainer.props.channel.id) {
                    Logger.info("Channel change detected.");
                    // if a channel object isn't created, or if the channel has changed, create new channel
                    this.channel = new Channel(
                        memberListContainer.props.channel.id,
                        this.guildId,
                        memberListContainer.props.rows
                    );

                    // if a filter has been applied, refresh the filter for new channel
                    if (this.filter) {
                        const roleIds = this.channel.getRoleIds(this.filter.roleName);

                        this.filterByIds(roleIds, this.filter.roleName, this.filter.roleStyle);
                    }
                }

                if (!this.filter) return value;

                const membersChild = value.props.children;
                
                const roleReactElem = React.createElement(Role, {
                    color: this.filter.roleStyle,
                    name: this.filter.roleName,
                    onClick: this.resetFilter
                });

                value.props.children = [
                    roleReactElem,
                    membersChild
                ];

                return value;
            });
        }

        /**
         * 
         * @param {*} value represents the react element of the member list 
         * @returns whether or not the container could be patched
         */
        patchMemberListContainer(value) {
            const memberList = ReactTools.getOwnerInstance(value.ref.current.parentElement);
            
            Patcher.after(memberList, "renderRow", (that, args, value) => {
                if (!this.filter || !this.filter.membersAllowed || !value || !value.props) return value;
                if (!value.props.user) {
                    Logger.log("got a problemo");
                }
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

        updateMemberList() {
            const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
            if (!memberList) return;
            this.forceUpdate(memberList.parentElement);
            this.forceUpdate(memberList);
        }

        forceUpdate(elem) {
            const owner = ReactTools.getOwnerInstance(elem);
            owner.forceUpdate();
            if (owner.handleScroll) owner.handleScroll();
        }

        filterByIds(roleIds, roleName, roleStyle) {
            const channelMembers = this.channel.getMembersByRoleIds(roleIds);
            

            this.filter = {
                roleName: roleName,
                roleStyle: roleStyle,
                membersAllowed: channelMembers.membersList,
                sectionsAllowed: channelMembers.groupList
            }
        }

        filterByName(roleName, roleStyle) {
            const channelMembers = this.channel.getMembersByRoleName(roleName);

            this.filter = {
                roleName: roleName,
                roleStyle: roleStyle,
                membersAllowed: channelMembers.membersList,
                sectionsAllowed: channelMembers.groupList
            }
        }

        patchRoles() {
            const roleModule = WebpackModules.getByProps("role")

            if(!roleModule.role.includes("interactive")) {
                roleModule.role += " interactive"
            }
            
            const RoleObj = WebpackModules.getModule(m => m && m.default.displayName === 'UserPopoutBody');
            Patcher.after(RoleObj, "default",  (_, [props], component) => {
                if (!component || !component.props || !component.props.className) return;

                this.guildId = props.guild.id;
                this.channel.guildId = props.guild.id;
            });
        }

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

            this.filterByName(roleName, roleStyle);
            
            Logger.info(`Clicked on role: "${roleName}". Members found: ${this.filter.membersAllowed.length}.`);

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